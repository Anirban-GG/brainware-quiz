/**
 * Client-Side Student Code Parser & Live Validator for Brainware University
 */

export const COURSE_NAMES = {
  BCA: 'Bachelor of Computer Applications',
  BCM: 'Bachelor of Commerce',
  MCA: 'Master of Computer Applications',
  BTECH: 'Bachelor of Technology (Computer Science & Engineering)',
  BSC: 'Bachelor of Science (Information Technology)',
  BBA: 'Bachelor of Business Administration',
  MBA: 'Master of Business Administration'
};

export const STUDENT_CODE_REGEX = /^BWU\/([A-Z]{2,10})\/(\d{2})\/(\d{3,})$/;

export function parseLiveStudentCode(code) {
  if (!code || typeof code !== 'string') {
    return { isValid: false, message: 'Please enter your Brainware student code' };
  }

  const trimmed = code.trim().toUpperCase();
  const match = trimmed.match(STUDENT_CODE_REGEX);

  if (!match) {
    return {
      isValid: false,
      message: 'Format must be BWU/COURSE/YY/ROLL (e.g. BWU/BCA/24/001)'
    };
  }

  const [, courseCode, yearDigits, rollNumber] = match;
  const university = 'Brainware University';
  const courseName = COURSE_NAMES[courseCode] || `${courseCode} Programme`;
  const admissionYear = 2000 + parseInt(yearDigits, 10);

  return {
    isValid: true,
    universityCode: 'BWU',
    university,
    courseCode,
    courseName,
    admissionYear,
    rollNumber,
    normalizedCode: trimmed
  };
}
