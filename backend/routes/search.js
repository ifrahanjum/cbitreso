const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);


router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ success: true, data: [] });
    }

    const query = q.trim();
    const results = [];

    const { data: depts } = await supabase
      .from('departments')
      .select('code, name')
      .or(`code.ilike.%${query}%,name.ilike.%${query}%`)
      .limit(3);

    if (depts) {
      depts.forEach(d => results.push({
        type: 'Department',
        name: d.name,
        meta: d.code,
        path: '/explorer',
        payload: { dept: d.code }
      }));
    }

    const { data: subs } = await supabase
      .from('subjects')
      .select('id, name, code, semester, department:departments(code)')
      .or(`name.ilike.%${query}%,code.ilike.%${query}%`)
      .limit(5);

    if (subs) {
      subs.forEach(s => results.push({
        type: 'Subject',
        name: s.name,
        meta: `${s.code || ''} • Sem ${s.semester} • ${s.department?.code || ''}`,
        path: '/explorer',
        payload: { dept: s.department?.code, sem: s.semester, subject_id: s.id, subject_name: s.name }
      }));
    }

    let resQuery = supabase
      .from('resources')
      .select('id, title, resource_type, subject:subjects(name)')
      .eq('status', 'active')
      .limit(10);

    const { data: resFts, error: ftsError } = await resQuery.textSearch('fts', query, { type: 'websearch', config: 'english' });
    
    let resData = resFts;
    if (ftsError || !resData || resData.length === 0) {
      console.log('FTS failed or empty, falling back to ilike');
      const { data: resIlike } = await supabase
        .from('resources')
        .select('id, title, resource_type, subject:subjects(name)')
        .ilike('title', `%${query}%`)
        .eq('status', 'active')
        .limit(10);
      resData = resIlike;
    }

    if (resData) {
      resData.forEach(r => results.push({
        type: 'Resource',
        name: r.title,
        meta: `${r.resource_type.replace('_', ' ')} • ${r.subject?.name || ''}`,
        path: `/reader/${r.id}`,
        payload: { id: r.id }
      }));
    }

    const semMatch = query.match(/sem(?:ester)?\s*([1-8])/i);
    if (semMatch) {
      const semNum = semMatch[1];
      results.unshift({
        type: 'Semester',
        name: `Semester ${semNum}`,
        meta: 'Global filter',
        path: '/browse',
        payload: { sem: semNum }
      });
    }

    return res.json({ success: true, data: results });
  } catch (err) {
    console.error('Global search error:', err);
    return res.status(500).json({ success: false, error: 'INTERNAL_ERROR' });
  }
});

module.exports = router;
