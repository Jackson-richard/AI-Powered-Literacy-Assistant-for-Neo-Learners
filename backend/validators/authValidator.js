const { body } = require('express-validator');

exports.registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('age').isInt({ min: 1 }).withMessage('Age must be a valid positive integer'),
  body('education').trim().notEmpty().withMessage('Education background is required'),
  body('preferredLanguage')
    .optional()
    .isIn(['English', 'Tamil', 'Hindi', 'Kannada', 'Telugu'])
    .withMessage('Language must be English, Tamil, Hindi, Kannada, or Telugu'),
  body('role')
    .optional()
    .isIn(['admin', 'teacher', 'learner'])
    .withMessage('Role must be admin, teacher, or learner'),
];

exports.loginRules = [
  body('email').isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];
