require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);


const CSE_SUBJECTS = [
  { code: '22MTC01', name: 'Linear Algebra and Calculus', credits: 4, type: 'Theory', sem: 1 },
  { code: '22PYC01', name: 'Optics and Semiconductor Physics', credits: 3, type: 'Theory', sem: 1 },
  { code: '22CSC01N', name: 'Problem Solving and Programming using C', credits: 3, type: 'Theory', sem: 1 },
  { code: '22EGC01N', name: 'English', credits: 2, type: 'Theory', sem: 1 },

  { code: '22MTC04', name: 'Differential Equations and Numerical Methods', credits: 4, type: 'Theory', sem: 2 },
  { code: '22CYC01', name: 'Chemistry', credits: 3, type: 'Theory', sem: 2 },
  { code: '22EEC01', name: 'Basic Electrical Engineering', credits: 3, type: 'Theory', sem: 2 },
  { code: '22ITC20N', name: 'Data Structures using C++', credits: 3, type: 'Theory', sem: 2 },

  { code: '22ITC02N', name: 'Java Programming', credits: 3, type: 'Theory', sem: 3 },
  { code: '22CSC06', name: 'Discrete Structures', credits: 4, type: 'Theory', sem: 3 },
  { code: '22CSC07N', name: 'Digital Logic Design', credits: 3, type: 'Theory', sem: 3 },
  { code: '22CSC14N', name: 'Design and Analysis of Algorithms', credits: 3, type: 'Theory', sem: 3 },

  { code: '22CSC10N', name: 'Computer Organization and Architecture', credits: 4, type: 'Theory', sem: 4 },
  { code: '22CSC11N', name: 'Database Management Systems', credits: 3, type: 'Theory', sem: 4 },
  { code: '22CSC48', name: 'Theory of Computation', credits: 3, type: 'Theory', sem: 4 },
  { code: '22CSC42', name: 'Web Programming', credits: 3, type: 'Theory', sem: 4 },
  { code: '22MTC12', name: 'Probability and Statistics', credits: 4, type: 'Theory', sem: 4 },

  { code: '22ITC10N', name: 'Computer Networks', credits: 3, type: 'Theory', sem: 5 },
  { code: '22CSC15N', name: 'Operating Systems', credits: 3, type: 'Theory', sem: 5 },
  { code: '22CSC21N', name: 'Software Engineering', credits: 3, type: 'Theory', sem: 5 },
  { code: '22CSC59', name: 'Fundamentals of Data Science', credits: 3, type: 'Theory', sem: 5 },

  { code: '22CSC24N', name: 'Compiler Design', credits: 3, type: 'Theory', sem: 6 },
  { code: '22CSC50', name: 'Artificial Intelligence and Machine Learning', credits: 4, type: 'Theory', sem: 6 },
  { code: '22CSC52', name: 'Data Analysis and Visualization', credits: 3, type: 'Theory', sem: 6 },

  { code: '22CSC54', name: 'Deep Learning for Computer Vision', credits: 3, type: 'Theory', sem: 7 },
  { code: '22CSC56', name: 'Network Security', credits: 4, type: 'Theory', sem: 7 },

  { code: '22CEM01', name: 'Environmental Science', credits: 0, type: 'Mandatory', sem: 8 },
];

const MOCK_RESOURCES = [
  { title: 'Linear Algebra - Matrices', type: 'notes', desc: 'Unit 1: Types of matrices and their properties.', subject: 'Linear Algebra and Calculus', sem: 1 },
  { title: 'C Programming - Control Flows', type: 'notes', desc: 'Unit 2: If-else, switch, and loops in C.', subject: 'Problem Solving and Programming using C', sem: 1 },
  { title: 'Physics Semester End 2022', type: 'question_paper', desc: 'Full syllabus end exam paper.', subject: 'Optics and Semiconductor Physics', sem: 1 },

  { title: 'Data Structures - Arrays & Stacks', type: 'notes', desc: 'Unit 1: Abstract Data Types and Stack implementation.', subject: 'Data Structures using C++', sem: 2 },
  { title: 'BEE - AC Circuits', type: 'notes', desc: 'Unit 3: Single phase and three phase AC circuits.', subject: 'Basic Electrical Engineering', sem: 2 },
  { title: 'Chemistry MID-1 2023', type: 'question_paper', desc: 'Mid-term examination paper.', subject: 'Chemistry', sem: 2 },

  { title: 'Java Intro & Classes', type: 'notes', desc: 'Unit 1: OOP concepts and class structures.', subject: 'Java Programming', sem: 3 },
  { title: 'DAA - Divide & Conquer', type: 'notes', desc: 'Unit 2: Binary search and Merge sort analysis.', subject: 'Design and Analysis of Algorithms', sem: 3 },
  { title: 'Discrete Structures End Exam', type: 'question_paper', desc: 'Comprehensive coverage of R22 syllabus.', subject: 'Discrete Structures', sem: 3 },
  { title: 'DLD - Sequential Circuits', type: 'notes', desc: 'Unit 4: Flip-flops and Counters.', subject: 'Digital Logic Design', sem: 3 },

  { title: 'Relational Algebra & SQL', type: 'notes', desc: 'Unit 2: Complex queries and normalization.', subject: 'Database Management Systems', sem: 4 },
  { title: 'COA - Basic Structure', type: 'notes', desc: 'Unit 1: Functional units and instruction sets.', subject: 'Computer Organization and Architecture', sem: 4 },
  { title: 'Theory of Computation 2022', type: 'question_paper', desc: 'Semester end question bank.', subject: 'Theory of Computation', sem: 4 },
  { title: 'Web Programming - JavaScript', type: 'notes', desc: 'Unit 3: DOM manipulation and ES6 features.', subject: 'Web Programming', sem: 4 },

  { title: 'OS - Process Management', type: 'notes', desc: 'Unit 1: Process states and scheduling algorithms.', subject: 'Operating Systems', sem: 5 },
  { title: 'CN - Network Layer', type: 'notes', desc: 'Unit 3: Routing protocols and IP addressing.', subject: 'Computer Networks', sem: 5 },
  { title: 'Software Engineering MID-2', type: 'question_paper', desc: 'Testing and maintenance focus.', subject: 'Software Engineering', sem: 5 },

  { title: 'Compiler Design - Lexical Analysis', type: 'notes', desc: 'Unit 1: Finite automata and tokenization.', subject: 'Compiler Design', sem: 6 },
  { title: 'AI - Search Techniques', type: 'notes', desc: 'Unit 2: A* and Heuristic search.', subject: 'Artificial Intelligence and Machine Learning', sem: 6 },
  { title: 'Data Analysis End Exam', type: 'question_paper', desc: 'Python and R analysis questions.', subject: 'Data Analysis and Visualization', sem: 6 },

  { title: 'Deep Learning Basics', type: 'notes', desc: 'Unit 1: Multi-layer perceptrons and Backpropagation.', subject: 'Deep Learning for Computer Vision', sem: 7 },
  { title: 'Network Security - Cryptography', type: 'notes', desc: 'Unit 3: AES and RSA algorithms.', subject: 'Network Security', sem: 7 },

  { title: 'Environmental Science Full Notes', type: 'notes', desc: 'Comprehensive guide for end exams.', subject: 'Environmental Science', sem: 8 },
];

async function seed() {
  console.log('🌱 Starting database seed...\n');

  const { data: cseDept, error: deptErr } = await supabase
    .from('departments')
    .select('id')
    .eq('code', 'CSE')
    .single();

  if (deptErr || !cseDept) {
    console.error(' CSE department not found. Did you run schema.sql first?');
    process.exit(1);
  }

  const cseDeptId = cseDept.id;
  console.log(` Found CSE department (id: ${cseDeptId})`);

  
  console.log(`\n Seeding ${CSE_SUBJECTS.length} subjects...`);

  const subjectRows = CSE_SUBJECTS.map(s => ({
    name: s.name,
    code: s.code,
    department_id: cseDeptId,
    semester: s.sem,
    regulation: 'R22'
  }));

  const { data: insertedSubjects, error: subjectErr } = await supabase
    .from('subjects')
    .upsert(subjectRows, { onConflict: 'department_id,semester,name,regulation', ignoreDuplicates: true })
    .select();

  if (subjectErr) {
    console.error(' Subject seed error:', subjectErr.message);
  }

  const { data: allSubjects } = await supabase
    .from('subjects')
    .select('id, name, semester')
    .eq('department_id', cseDeptId);

  const subjectMap = {};
  allSubjects?.forEach(s => {
    subjectMap[`${s.name}_${s.semester}`] = s.id;
  });

  console.log(` ${allSubjects?.length || 0} subjects in database`);

  // 4. Seed resources
  console.log(`\n Seeding ${MOCK_RESOURCES.length} resources...`);

  let seeded = 0;
  let skipped = 0;

  for (const res of MOCK_RESOURCES) {
    const subjectId = subjectMap[`${res.subject}_${res.sem}`];
    if (!subjectId) {
      console.warn(`   Subject not found: "${res.subject}" (sem ${res.sem}), skipping resource "${res.title}"`);
      skipped++;
      continue;
    }

    const { data: existing } = await supabase
      .from('resources')
      .select('id')
      .eq('title', res.title)
      .eq('subject_id', subjectId)
      .limit(1);

    if (existing && existing.length > 0) {
      skipped++;
      continue;
    }

    const { error: resErr } = await supabase
      .from('resources')
      .insert({
        title: res.title,
        description: res.desc,
        subject_id: subjectId,
        resource_type: res.type,
        file_url: `https://placeholder.reso.cbit/${res.type}/${res.title.toLowerCase().replace(/\s+/g, '-')}.pdf`,
        file_name: `${res.title.replace(/\s+/g, '_')}.pdf`,
        file_size: Math.floor(Math.random() * 5000000) + 500000, // 500KB–5MB
        file_hash: require('crypto').randomBytes(32).toString('hex'),
        mime_type: 'application/pdf',
        status: 'active',
        download_count: Math.floor(Math.random() * 300) + 20
      });

    if (resErr) {
      console.warn(`   Resource insert error for "${res.title}": ${resErr.message}`);
      skipped++;
    } else {
      seeded++;
    }
  }

  console.log(` Seeded: ${seeded}, Skipped: ${skipped}`);

  console.log('\n Database seed complete!');
}

seed().catch(err => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
