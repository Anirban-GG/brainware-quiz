/**
 * Centralized Course Mapping & Student Code Parser for Brainware University
 */

const COURSE_CATALOG = {
  BCA: 'Bachelor of Computer Applications',
  BCM: 'Bachelor of Commerce',
  MCA: 'Master of Computer Applications',
  BTECH: 'Bachelor of Technology (Computer Science & Engineering)',
  BSC: 'Bachelor of Science (Information Technology)',
  BBA: 'Bachelor of Business Administration',
  MBA: 'Master of Business Administration'
};

const STUDENT_CODE_REGEX = /^BWU\/([A-Z]{2,10})\/(\d{2})\/(\d{3,})$/;

/**
 * Validate and parse a Brainware University student code
 * Format: BWU/COURSE/YY/ROLL
 * Example: BWU/BCA/24/001
 */
function parseStudentCode(studentCode) {
  if (!studentCode || typeof studentCode !== 'string') {
    return { isValid: false, error: 'Student code is required' };
  }

  const trimmed = studentCode.trim().toUpperCase();
  const match = trimmed.match(STUDENT_CODE_REGEX);

  if (!match) {
    return {
      isValid: false,
      error: 'Invalid student code format. Expected format: BWU/COURSE/YY/ROLL (e.g. BWU/BCA/24/001)'
    };
  }

  const [, courseCode, yearStr, rollNumber] = match;
  const universityCode = 'BWU';
  const universityName = 'Brainware University';
  const courseName = COURSE_CATALOG[courseCode] || `${courseCode} Programme`;
  const admissionYear = 2000 + parseInt(yearStr, 10);

  return {
    isValid: true,
    normalizedCode: trimmed,
    universityCode,
    universityName,
    courseCode,
    courseName,
    admissionYear,
    rollNumber // String preserving leading zeros (e.g., '020')
  };
}

module.exports = {
  COURSE_CATALOG,
  STUDENT_CODE_REGEX,
  parseStudentCode
};
