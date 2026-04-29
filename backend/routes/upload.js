

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const multer = require('multer');
const { z } = require('zod');
const { createClient } = require('@supabase/supabase-js');
const { authenticate, authorizeOwnerOrAdmin } = require('../middleware');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const ALLOWED_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
];
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.ppt', '.pptx'];
const BUCKET_NAME = 'resources';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const ext = '.' + file.originalname.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(new Error('INVALID_FILE_TYPE'), false);
    }
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      return cb(new Error('INVALID_FILE_TYPE'), false);
    }
    cb(null, true);
  }
});

const uploadSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(300, 'Title must be at most 300 characters'),
  description: z.string().max(2000).optional().default(''),
  subject_id: z.coerce.number().int().positive('Invalid subject').optional().nullable(),
  resource_type: z.enum(['notes', 'question_paper', 'question_bank', 'course_pack', 'important_questions', 'calendar', 'academic_schedule']),
  is_anonymous: z.coerce.boolean().optional().default(false),
  unit: z.coerce.number().int().min(1).max(5).optional().nullable(),
  exam_type: z.string().optional().nullable(),
  regulation: z.string().optional().nullable(),
  dept: z.string().optional().nullable(),
  sem: z.coerce.number().int().min(1).max(8).optional().nullable()
});

let bucketReady = false;
async function ensureBucket() {
  if (bucketReady) return;
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some(b => b.name === BUCKET_NAME);
    if (!exists) {
      await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: MAX_FILE_SIZE,
        allowedMimeTypes: ALLOWED_MIMES
      });
      console.log(` Created storage bucket: ${BUCKET_NAME}`);
    }
    bucketReady = true;
  } catch (err) {
    console.error('Bucket setup error:', err.message);
  }
}

function sanitizeFilename(name) {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 200);
}

router.post('/',
  authenticate,
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ success: false, error: 'FILE_TOO_LARGE', message: 'File exceeds 25MB limit' });
        }
        if (err.message === 'INVALID_FILE_TYPE') {
          return res.status(400).json({ success: false, error: 'INVALID_FILE_TYPE', message: 'Only PDF, DOC, DOCX, PPT, PPTX files are allowed' });
        }
        return res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: 'File upload failed' });
      }
      next();
    });
  },
  async (req, res) => {
    try {
     
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: 'No file provided' });
      }

      const parsed = uploadSchema.safeParse(req.body);
      if (!parsed.success) {
        const firstError = parsed.error.errors[0];
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: firstError.message,
          details: parsed.error.errors
        });
      }
      const { title, description, resource_type, is_anonymous } = parsed.data;
      let subject_id = parsed.data.subject_id;

      const isCalendar = resource_type === 'calendar' || resource_type === 'academic_schedule';
      if (isCalendar && !subject_id) {
        const dept = parsed.data.dept || 'CSE';
        const sem = parsed.data.sem || 1;

        const { data: deptRow } = await supabase
          .from('departments')
          .select('id')
          .eq('code', dept)
          .single();

        if (!deptRow) {
          return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: `Department '${dept}' not found` });
        }

        let { data: generalSubject } = await supabase
          .from('subjects')
          .select('id')
          .eq('department_id', deptRow.id)
          .eq('semester', sem)
          .eq('name', 'General')
          .single();

        if (!generalSubject) {
          const { data: created, error: createErr } = await supabase
            .from('subjects')
            .insert({
              name: 'General',
              code: `GEN-${dept}-S${sem}`,
              department_id: deptRow.id,
              semester: sem,
              regulation: 'ALL'
            })
            .select('id')
            .single();

          if (createErr) {
            console.error('Failed to create General subject:', createErr);
            return res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: 'Failed to resolve subject for calendar' });
          }
          generalSubject = created;
        }

        subject_id = generalSubject.id;
      }

      if (!isCalendar && !subject_id) {
        return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: 'subject_id is required' });
      }

      const { data: subject, error: subErr } = await supabase
        .from('subjects')
        .select('id, name, semester, department_id, department:departments(code)')
        .eq('id', subject_id)
        .single();

      if (subErr || !subject) {
        return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: 'Invalid subject_id' });
      }

      const fileHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');

      let isDuplicate = false;
      let duplicateOf = null;
      const { data: existing } = await supabase
        .from('resources')
        .select('id, title')
        .eq('file_hash', fileHash)
        .eq('status', 'active')
        .limit(1);

      if (existing && existing.length > 0) {
        isDuplicate = true;
        duplicateOf = existing[0].id;
      }

      await ensureBucket();

      const deptCode = subject.department?.code || 'MISC';
      const fileExt = '.' + req.file.originalname.split('.').pop().toLowerCase();
      const uuid = crypto.randomUUID();
      const storagePath = `${deptCode}/sem${subject.semester}/${subject_id}/${uuid}-${sanitizeFilename(req.file.originalname)}`;

      const { data: storageData, error: storageErr } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false
        });

      if (storageErr) {
        console.error('Storage upload error:', storageErr);
        return res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: 'Failed to store file' });
      }

      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(storagePath);

      const fileUrl = urlData?.publicUrl || storagePath;

      
      const dbResourceType = resource_type === 'academic_schedule' ? 'calendar' : resource_type;
      const { data: resource, error: dbErr } = await supabase
        .from('resources')
        .insert({
          title,
          description: description || null,
          subject_id,
          resource_type: dbResourceType,
          file_url: fileUrl,
          file_name: req.file.originalname,
          file_size: req.file.size,
          file_hash: fileHash,
          mime_type: req.file.mimetype,
          uploaded_by: req.user.id,
          is_anonymous,
          is_duplicate_flagged: isDuplicate,
          duplicate_of: duplicateOf,
          unit: parsed.data.unit || null,
          exam_type: parsed.data.exam_type || null,
          regulation: parsed.data.regulation || null,
          status: 'active' 
        })
        .select()
        .single();

      if (dbErr) {
        console.error('DB insert error:', dbErr);
        await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
        return res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: 'Failed to create resource record' });
      }

      return res.status(201).json({
        success: true,
        data: {
          id: resource.id,
          title: resource.title,
          resource_type: resource.resource_type,
          file_name: resource.file_name,
          file_size: resource.file_size,
          status: resource.status,
          is_duplicate_flagged: isDuplicate,
          duplicate_of: duplicateOf,
          created_at: resource.created_at
        },
        message: isDuplicate
          ? 'Upload successful — but this file appears to be a duplicate.'
          : 'Upload successful!'
      });

    } catch (err) {
      console.error('Upload error:', err);
      return res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: 'Upload failed' });
    }
  }
);

router.delete('/:id',
  authenticate,
  async (req, res, next) => {
    const { data, error } = await supabase
      .from('resources')
      .select('id, uploaded_by, file_url, status')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      console.log('Delete target not found. ID:', req.params.id, 'Error:', error);
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Resource not found' });
    }
    console.log('Delete target found:', data.id, 'Owner:', data.uploaded_by, 'Current User:', req.user.id);
    req.resource = data;
    next();
  },
  authorizeOwnerOrAdmin,
  async (req, res) => {
    try {
      if (req.resource.file_url) {
        try {
          const urlParts = req.resource.file_url.split('/resources/');
          if (urlParts.length > 1) {
            const storagePath = urlParts[1];
            await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
          }
        } catch (storageErr) {
          console.error('Failed to remove file from storage:', storageErr.message);
        }
      }

      const { error } = await supabase
        .from('resources')
        .update({ status: 'deleted', updated_at: new Date().toISOString() })
        .eq('id', req.params.id);

      if (error) {
        console.error('Supabase update error (delete):', error);
        return res.status(500).json({ 
          success: false, 
          error: 'INTERNAL_ERROR', 
          message: 'Failed to delete resource',
          details: error.message 
        });
      }

      return res.json({ success: true, message: 'Resource deleted successfully' });
    } catch (err) {
      console.error('Delete error:', err);
      return res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: 'Delete failed' });
    }
  }
);

module.exports = router;
