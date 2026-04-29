const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

router.get('/departments', async (req, res) => {
  try {
    const { data, error } = await supabase.from('departments').select('id, code, name').eq('is_active', true).order('name');
    if (error) throw error;
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: 'Failed to fetch departments' });
  }
});

router.get('/departments/:code/subjects', async (req, res) => {
  try {
    const { code } = req.params;
    const { semester, regulation } = req.query;
    const { data: dept, error: deptErr } = await supabase.from('departments').select('id, code, name').eq('code', code.toUpperCase()).single();
    if (deptErr || !dept) return res.status(404).json({ success: false, error: 'NOT_FOUND', message: `Department "${code}" not found` });

    let query = supabase.from('subjects').select('id, name, code, semester, regulation').eq('department_id', dept.id).order('semester').order('name');
    if (semester) query = query.eq('semester', parseInt(semester));
    if (regulation) query = query.eq('regulation', regulation.toUpperCase());

    const { data, error } = await query;
    if (error) throw error;
    return res.json({ success: true, data, department: { code: dept.code, name: dept.name } });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: 'Failed to fetch subjects' });
  }
});

router.get('/regulations', async (req, res) => {
  try {
    const { data, error } = await supabase.from('subjects').select('regulation');
    if (error) throw error;
    const unique = [...new Set(data.map(r => r.regulation))];
    return res.json({ success: true, data: unique });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: 'Failed to fetch regulations' });
  }
});

router.get('/resource-types', (req, res) => {
  res.json({ success: true, data: ['notes', 'question_paper', 'question_bank', 'course_pack', 'important_questions', 'calendar'] });
});

module.exports = router;
