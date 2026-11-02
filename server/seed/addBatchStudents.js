require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { parseStudentCode } = require('../config/courses');

const rawStudentsList = [
  { code: 'BWU/BCA/24/037', name: 'SUBHRADEEP DEY' },
  { code: 'BWU/BCA/24/048', name: 'BIKRAM MONDAL' },
  { code: 'BWU/BCA/24/051', name: 'KUNAL CHOWDHURY' },
  { code: 'BWU/BCA/24/057', name: 'RAHUL MAITI' },
  { code: 'BWU/BCA/24/059', name: 'DEBJIT MAITI' },
  { code: 'BWU/BCA/24/053', name: 'DEBASHIS ROY' },
  { code: 'BWU/BCA/24/038', name: 'ASIM BARMAN' },
  { code: 'BWU/BCA/24/040', name: 'ARPAN NASKAR' },
  { code: 'BWU/BCA/24/052', name: 'ANIRBAN DAS' },
  { code: 'BWU/BCA/24/054', name: 'SOUMYADIP JANA' },

  { code: 'BWU/BCA/24/011', name: 'ANKANA DEBNATH' },
  { code: 'BWU/BCA/24/007', name: 'ASHMITA MONDAL' },
  { code: 'BWU/BCA/24/031', name: 'NEHA BISWAS' },
  { code: 'BWU/BCA/24/041', name: 'ANISH MISHRA' },
  { code: 'BWU/BCA/24/005', name: 'ARINDAM ROY' },

  { code: 'BWU/BCA/24/019', name: 'TIYASHA SARKAR' },
  { code: 'BWU/BCA/24/035', name: 'SWAGATA DAS' },
  { code: 'BWU/BCA/24/055', name: 'POULAMI DAS' },
  { code: 'BWU/BCA/24/015', name: 'SREYASI MAITY' },
  { code: 'BWU/BCA/24/010', name: 'PULAK MONDAL' },

  { code: 'BWU/BCA/24/049', name: 'RAJAT BANERJEE' },
  { code: 'BWU/BCA/24/050', name: 'SHAHEEN KHATUN' },
  { code: 'BWU/BCA/24/042', name: 'ROHAN MALLICK' },
  { code: 'BWU/BCA/24/047', name: 'ARJUN DAS' },
  { code: 'BWU/BCA/24/060', name: 'RASEL SK' },

  { code: 'BWU/BCA/24/044', name: 'POUSHALI ROY' },
  { code: 'BWU/BCA/24/046', name: 'MEGHABROTO MONDAL' },
  { code: 'BWU/BCA/24/022', name: 'RANITA MITRA' },
  { code: 'BWU/BCA/24/045', name: 'RISHITA CHATTERJEE' },
  { code: 'BWU/BCA/24/013', name: 'DHRUBAJYOTI PANDEY' },
  { code: 'BWU/BCA/24/008', name: 'MOHAN MANDAL' },
  { code: 'BWU/BCA/24/006', name: 'SWARNENDU DIKSHIT' },
  { code: 'BWU/BCA/24/039', name: 'POULAMI DEBNATH' },
  { code: 'BWU/BCA/24/036', name: 'MADHUMITA KHATUA' },
  { code: 'BWU/BCA/24/034', name: 'SRIJA BERA' },

  { code: 'BWU/BCA/24/026', name: 'MOUNAMI CHOWDHURY' },
  { code: 'BWU/BCA/24/014', name: 'SUPRIYA DAS' },
  { code: 'BWU/BCA/24/017', name: 'MIR ASIF HOSSAIN' },
  { code: 'BWU/BCA/24/023', name: 'SUBHADEEP MUDI' },
  { code: 'BWU/BCA/24/032', name: 'TISTA BISWAS' },

  { code: 'BWU/BCA/24/028', name: 'ABHIJIT JANA' },
  { code: 'BWU/BCA/24/021', name: 'SNIGDHA BISWAS' },
  { code: 'BWU/BCA/24/018', name: 'SOUMADEEP NASKAR' },
  { code: 'BWU/BCA/24/024', name: 'RANA MONDAL' },
  { code: 'BWU/BCA/24/025', name: 'Oilia Basu' },
  { code: 'BWU/BCA/24/020', name: 'ANIRBAN SHEE' },
  { code: 'BWU/BCA/24/009', name: 'SATYAJIT ROY' },
  { code: 'BWU/BCA/24/003', name: 'MIJANUL ISLAM' },
  { code: 'BWU/BCA/24/043', name: 'AYENDU PAUL' },
  { code: 'BWU/BCA/24/056', name: 'SOUMEN MAITY' },

  { code: 'BWU/BCM/24/006', name: 'RITESH BHATTA' },
  { code: 'BWU/BCM/24/012', name: 'AVIJIT SAHOO' },
  { code: 'BWU/BCM/24/008', name: 'SOUMYAJIT SHAW' },
  { code: 'BWU/BCM/24/009', name: 'DHANANJAY JANA' },
  { code: 'BWU/BCM/24/019', name: 'DIP KUMAR BERA' },

  { code: 'BWU/BCA/24/016', name: 'NILANJAN DAS' },
  { code: 'BWU/BCA/24/411', name: 'TIYASHA PAIK' },
  { code: 'BWU/BCA/24/004', name: 'NUR ALAM SHEIKH' },
  { code: 'BWU/BCA/24/029', name: 'PRITAM DAS' },
  { code: 'BWU/BCA/24/030', name: 'SURYAKANTA MAITY' }
];

// Helper to format title case
function toTitleCase(str) {
  return str
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Split full name into firstName and lastName
function splitName(fullName) {
  const clean = fullName.trim().replace(/\s+/g, ' ');
  const parts = clean.split(' ');
  if (parts.length === 1) {
    return {
      firstName: toTitleCase(parts[0]),
      lastName: 'Student'
    };
  }
  const lastName = toTitleCase(parts.pop());
  const firstName = toTitleCase(parts.join(' '));
  return { firstName, lastName };
}

async function addBatchStudents() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/brainware_quiz';
    await mongoose.connect(mongoUri);
    console.log('[Batch Students] Connected to MongoDB at:', mongoUri);

    console.log(`[Batch Students] Processing ${rawStudentsList.length} students...`);

    let addedCount = 0;
    let updatedCount = 0;

    for (const item of rawStudentsList) {
      const parsed = parseStudentCode(item.code);
      if (!parsed.isValid) {
        console.error(`[Error] Invalid code for ${item.name}: ${item.code}`);
        continue;
      }

      const { firstName, lastName } = splitName(item.name);

      // Default password is their Student Code
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(parsed.normalizedCode, salt);

      const existing = await User.findOne({ studentCode: parsed.normalizedCode });

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

    console.log(`\n[Batch Students Complete] Successfully added ${addedCount} new students, updated ${updatedCount} existing.`);
    console.log(`Total active students now enrolled: ${await User.countDocuments({ role: 'student' })}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[Batch Students Error]:', err);
    process.exit(1);
  }
}

addBatchStudents();
