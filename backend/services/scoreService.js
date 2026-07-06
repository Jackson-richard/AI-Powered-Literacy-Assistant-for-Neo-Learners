const Question = require('../models/Question');
const Response = require('../models/Response');
const Result = require('../models/Result');

/**
 * Grades a batch of responses and calculates the score for a specific assessment.
 * @param {string} userId - ID of the learner
 * @param {string} assessmentId - ID of the assessment
 * @param {Array} submissions - Array of { questionId, selectedAnswer }
 * @returns {Object} result - Calculated result object with score details
 */
exports.gradeAssessment = async (userId, assessmentId, submissions) => {
  let totalPointsPossible = 0;
  let totalPointsScored = 0;

  // Track scores by question type
  const typePointsPossible = { Reading: 0, Writing: 0, Comprehension: 0 };
  const typePointsScored = { Reading: 0, Writing: 0, Comprehension: 0 };

  const savedResponses = [];

  for (const sub of submissions) {
    const question = await Question.findById(sub.questionId);
    if (!question) continue;

    // Check if the answer is correct
    // Trim and case-insensitive check for text, or direct option match
    const cleanCorrect = question.correctAnswer.trim().toLowerCase();
    const cleanSelected = sub.selectedAnswer.trim().toLowerCase();
    const isCorrect = cleanCorrect === cleanSelected;
    
    const pointsScored = isCorrect ? question.points : 0;

    // Accumulate total points
    totalPointsPossible += question.points;
    totalPointsScored += pointsScored;

    // Accumulate points by type
    if (typePointsPossible[question.type] !== undefined) {
      typePointsPossible[question.type] += question.points;
      typePointsScored[question.type] += pointsScored;
    }

    // Save individual response
    const response = await Response.create({
      userId,
      assessmentId,
      questionId: sub.questionId,
      selectedAnswer: sub.selectedAnswer,
      isCorrect,
      score: pointsScored,
    });

    savedResponses.push(response._id);
  }

  // Calculate percentage scores
  const getPercentage = (scored, possible) => {
    if (possible === 0) return 0;
    return Math.round((scored / possible) * 100);
  };

  const readingPercentage = getPercentage(typePointsScored.Reading, typePointsPossible.Reading);
  const writingPercentage = getPercentage(typePointsScored.Writing, typePointsPossible.Writing);
  const comprehensionPercentage = getPercentage(typePointsScored.Comprehension, typePointsPossible.Comprehension);
  const overallPercentage = getPercentage(totalPointsScored, totalPointsPossible);

  // Determine proficiency: 0-40 Beginner, 41-70 Intermediate, 71-100 Advanced
  let proficiency = 'Beginner';
  if (overallPercentage > 70) {
    proficiency = 'Advanced';
  } else if (overallPercentage > 40) {
    proficiency = 'Intermediate';
  }

  // Save assessment result log
  const result = await Result.create({
    userId,
    assessmentId,
    scores: {
      reading: readingPercentage,
      writing: writingPercentage,
      comprehension: comprehensionPercentage,
      overall: overallPercentage,
    },
    responses: savedResponses,
    proficiency,
  });

  return result;
};
