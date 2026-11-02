
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { parseStudentCode } = require('../config/courses');
const { rawStudentsList, splitName } = require('./studentsList');

async function addBatchStudents() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/brainware_quiz';
    await mongoose.connect(mongoUri);

    console.log('[Batch Students] Connected to MongoDB');
    console.log(`[Batch Students] Processing ${rawStudentsList.length} students...`);

    let addedCount = 0;
    let updatedCount = 0;

    for (const item of rawStudentsList) {
      const parsed = parseStudentCode(item.code);

      if (!parsed.isValid) {
        console.error(`[Error] Invalid student code: ${item.code}`);
        continue;
      }

      const { firstName, lastName } = splitName(item.name);

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(parsed.normalizedCode, salt);

      const existing = await User.findOne({
        studentCode: parsed.normalizedCode
      });

      if (existing) {
        existing.firstName = firstName;
        existing.lastName = lastName;
        existing.courseCode = parsed.courseCode;
        existing.courseName = parsed.courseName;
        existing.admissionYear = parsed.admissionYear;
        existing.rollNumber = parsed.rollNumber;
        existing.status = 'active';
        await existing.save();
        updatedCount++;
      } else {
        await User.create({
          firstName,
          lastName,
          studentCode: parsed.normalizedCode,
          universityCode: parsed.universityCode,
          universityName: parsed.universityName,
          courseCode: parsed.courseCode,
          courseName: parsed.courseName,
          admissionYear: parsed.admissionYear,
          rollNumber: parsed.rollNumber,
          passwordHash,
          role: 'student',
          mustChangePassword: true,
          status: 'active'
        });
        addedCount++;
      }
    }

    console.log(`[Batch Students Complete] Added ${addedCount}, updated ${updatedCount}.`);
    console.log(`Total active students: ${await User.countDocuments({ role: 'student' })}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[Batch Students Error]:', err);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

addBatchStudents();
