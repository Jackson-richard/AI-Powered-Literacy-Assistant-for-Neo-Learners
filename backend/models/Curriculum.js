const mongoose = require('mongoose');

const CurriculumSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a curriculum title'],
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
    order: {
      type: Number,
      required: [true, 'Please specify curriculum ordering index'],
      default: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    lessons: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson',
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Curriculum', CurriculumSchema);
