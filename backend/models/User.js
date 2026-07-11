const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    age: {
      type: Number,
      required: [true, 'Please add age'],
    },
    education: {
      type: String,
      required: [true, 'Please add educational qualification'],
    },
    preferredLanguage: {
      type: String,
      enum: ['English', 'Tamil', 'Hindi', 'Kannada', 'Telugu'],
      default: 'English',
    },
    role: {
      type: String,
      enum: ['admin', 'teacher', 'learner'],
      default: 'learner',
    },
    xp: {
      type: Number,
      default: 0,
    },
    streak: {
      type: Number,
      default: 0,
    },
    hearts: {
      type: Number,
      default: 5,
    },
    dailyGoal: {
      type: Number,
      default: 50, // default target XP per day
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    unlockedLessons: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson',
      },
    ],
    achievements: [
      {
        title: { type: String, required: true },
        description: { type: String, required: true },
        unlockedAt: { type: Date, default: Date.now },
      },
    ],
    badges: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
