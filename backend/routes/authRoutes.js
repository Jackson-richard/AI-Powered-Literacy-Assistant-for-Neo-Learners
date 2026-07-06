const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile } = require('../controllers/authController');
const { registerRules, loginRules } = require('../validators/authValidator');
const { validate } = require('../middleware/valMiddleware');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);
router.route('/profile')
  .get(protect, getProfile)
  .put(protect, updateProfile);

module.exports = router;
