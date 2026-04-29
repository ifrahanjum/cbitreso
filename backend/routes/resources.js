const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { authenticate, optionalAuthenticate } = require('../middleware');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);


router.get('/', optionalAuthenticate, async (req, res) => {
  try {
    const {
      department, semester, regulation, resource_type,
      subject_id, search, page = 1, per_page = 20,
      sort = 'created_at', order = 'desc'
    } = req.query;

    const limit = Math.min(parseInt(per_page) || 20, 50);
    const offset = (Math.max(parseInt(page) || 1, 1) - 1) * limit;

    let query = supabase
      .from('resources')
      .select(`
        id, title, description, resource_type, file_name, file_size, file_url, download_count, status, created_at, uploaded_by, is_anonymous, unit, exam_type, regulation,
        subject:subjects!inner(id, name, code, semester, regulation,
          department:departments!inner(id, code, name)
        )
      `, { count: 'exact' })
      .eq('status', 'active');

    if (department) {
      query = query.eq('subject.department.code', department.toUpperCase());
    }
    if (semester) {
      query = query.eq('subject.semester', parseInt(semester));
    }
    if (regulation) {
      query = query.eq('subject.regulation', regulation.toUpperCase());
    }
    if (resource_type) {
      query = query.eq('resource_type', resource_type);
    }
    if (subject_id) {
      query = query.eq('subject_id', parseInt(subject_id));
    }
    if (search) {
      query = query.textSearch('fts', search, { type: 'websearch', config: 'english' });
    }

    const validSorts = ['created_at', 'title', 'download_count'];
    const sortField = validSorts.includes(sort) ? sort : 'created_at';
    const ascending = order === 'asc';
    query = query.order(sortField, { ascending }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    const formatted = (data || []).map(r => {
      const isOwner = req.user?.id === r.uploaded_by;
      return {
        id: r.id,
        title: r.title,
        description: r.description,
        resource_type: r.resource_type,
        file_name: r.file_name,
        file_size: r.file_size,
        file_url: r.file_url,
        download_count: r.download_count,
        uploaded_by: (r.is_anonymous && !isOwner) ? null : r.uploaded_by,
        is_owner: isOwner,
        is_anonymous: r.is_anonymous,
        created_at: r.created_at,
        unit: r.unit,
        exam_type: r.exam_type,
        regulation: r.regulation,
        subject: r.subject ? {
          id: r.subject.id,
          name: r.subject.name,
          code: r.subject.code,
          semester: r.subject.semester,
          regulation: r.subject.regulation
        } : null,
        department: r.subject?.department ? {
          code: r.subject.department.code,
          name: r.subject.department.name
        } : null
      };
    });

    return res.json({
      success: true,
      data: formatted,
      meta: {
        page: parseInt(page) || 1,
        per_page: limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (err) {
    console.error('GET /resources error:', err.message);
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: 'Failed to fetch resources' });
  }
});


router.get('/suggestions', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ success: true, data: [] });
    }

    const { data, error } = await supabase
      .from('resources')
      .select(`
        id, title, resource_type,
        subject:subjects!inner(name, code)
      `)
      .eq('status', 'active')
      .textSearch('fts', q.trim(), { type: 'websearch', config: 'english' })
      .limit(5);

    if (error) throw error;
    
    const formatted = data.map(r => ({
      id: r.id,
      title: r.title,
      resource_type: r.resource_type,
      subject_name: r.subject.name,
      subject_code: r.subject.code
    }));

    return res.json({ success: true, data: formatted });
  } catch (err) {
    console.error('GET /resources/suggestions error:', err.message);
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});


router.get('/:id', optionalAuthenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('resources')
      .select(`
        id, title, description, resource_type, file_url, file_name, file_size,
        download_count, status, created_at, is_anonymous, unit, exam_type, regulation,
        subject:subjects(id, name, code, semester, regulation,
          department:departments(code, name)
        ),
        uploader:users(id, name)
      `)
      .eq('id', req.params.id)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Resource not found' });
    }

    const isOwner = req.user?.id === data.uploader?.id;
    if (data.is_anonymous && !isOwner) {
      data.uploader = { id: null, name: 'Anonymous' };
    }
    data.is_owner = isOwner;

    return res.json({ success: true, data });
  } catch (err) {
    console.error('GET /resources/:id error:', err.message);
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: 'Failed to fetch resource' });
  }
});


module.exports = router;
