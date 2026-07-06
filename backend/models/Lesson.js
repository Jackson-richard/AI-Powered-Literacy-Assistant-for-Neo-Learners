const mongoose = require('mongoose');

const LessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a lesson title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
      trim: true,
    },
    difficulty: {
      type: String,
      required: [true, 'Please specify difficulty level'],
      enum: ['Beginner', 'Intermediate', 'Advanced'],
    },
    estimatedDuration: {
      type: Number,
      required: [true, 'Please specify estimated duration in minutes'],
    },
    category: {
      type: String,
      required: [true, 'Please specify lesson category'],
      trim: true,
    },
    language: {
      type: String,
      default: 'English',
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    translations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LessonTranslation',
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Lesson', LessonSchema);
