const DEPT_CODES = {
  '732': 'civ',
  '733': 'cse',
  '734': 'eee',
  '735': 'ece',
  '736': 'mec',
  '737': 'it',
  '729': 'aiml',
  '748': 'cse-aiml',
  '749': 'cet',
  '771': 'aids',
  '802': 'chem',
  '805': 'bio',
};

const DEPT_NAMES = Object.fromEntries(
  Object.entries(DEPT_CODES).map(([code, name]) => [name, code])
);

function validateStudent(rollNo, password) {
  if (!rollNo || !password) {
    return { valid: false, error: 'Roll number and password are required' };
  }

  const cleaned = rollNo.trim();

  if (!/^1601\d{8}$/.test(cleaned)) {
    return { valid: false, error: 'Invalid roll number format (expected 12 digits starting with 1601)' };
  }

  const deptCode = cleaned.substring(6, 9);
  const expectedDept = DEPT_CODES[deptCode];

  if (!expectedDept) {
    return { valid: false, error: `Unrecognized department code "${deptCode}" in roll number` };
  }

  if (password.toLowerCase().trim() !== expectedDept) {
    return { valid: false, error: 'Incorrect department password' };
  }

  return {
    valid: true,
    syntheticEmail: `${cleaned}@student.reso.cbit`,
    dept: expectedDept.toUpperCase(),
    deptCode,
    role: 'student',
    displayName: cleaned,
    identifier: cleaned
  };
}

function validateFaculty(email, password) {
  if (!email || !password) {
    return { valid: false, error: 'Email and password are required' };
  }

  const cleaned = email.toLowerCase().trim();

  const match = cleaned.match(/^(.+)_([a-z][a-z\-]*)@cbit\.ac\.in$/);
  if (!match) {
    return { valid: false, error: 'Email must be in format name_dept@cbit.ac.in' };
  }

  const [, namePart, dept] = match;

  if (password.toLowerCase().trim() !== dept) {
    return { valid: false, error: 'Incorrect department password' };
  }

  const displayName = namePart
    .split(/[._]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  return {
    valid: true,
    email: cleaned,
    dept: dept.toUpperCase(),
    role: 'faculty',
    displayName,
    identifier: cleaned
  };
}

module.exports = { validateStudent, validateFaculty, DEPT_CODES, DEPT_NAMES };
