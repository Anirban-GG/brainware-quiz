const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      unique: true
    },
    studentCode: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true,
      unique: true
    },
    universityCode: {
      type: String,
      default: 'BWU'
    },
    universityName: {
      type: String,
      default: 'Brainware University'
    },
    courseCode: {
      type: String,
      uppercase: true
    },
    courseName: {
      type: String
    },
    admissionYear: {
      type: Number
    },
    rollNumber: {
      type: String // String to preserve leading zeros like '020'
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required']
    },
    role: {
      type: String,
      enum: ['student', 'teacher', 'admin'],
      default: 'student'
    },
    mustChangePassword: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

// Method to verify password against bcrypt hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Virtual for full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

// Transform output to never expose passwordHash and provide passwordStatus
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.passwordHash;
  obj.passwordStatus = this.mustChangePassword ? 'Default' : 'Changed';
  return obj;
};

module.exports = mongoose.model('User', userSchema);
