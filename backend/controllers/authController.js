const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_key', {
    expiresIn: process.env.JWT_EXPIRE || '24h',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, age, education, preferredLanguage, role } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Create user (Note: password hashing happens pre-save in User model)
    const user = await User.create({
      name,
      email,
      password,
      age,
      education,
      preferredLanguage: preferredLanguage || 'English',
      role: role || 'learner',
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        education: user.education,
        preferredLanguage: user.preferredLanguage,
        role: user.role,
        xp: user.xp,
        streak: user.streak,
        hearts: user.hearts,
        dailyGoal: user.dailyGoal,
        achievements: user.achievements,
        badges: user.badges,
        unlockedLessons: user.unlockedLessons,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate a user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user and select password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        education: user.education,
        preferredLanguage: user.preferredLanguage,
        role: user.role,
        xp: user.xp,
        streak: user.streak,
        hearts: user.hearts,
        dailyGoal: user.dailyGoal,
        achievements: user.achievements,
        badges: user.badges,
        unlockedLessons: user.unlockedLessons,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email, age, education, preferredLanguage } = req.body;
    
    // Find user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (age) user.age = age;
    if (education) user.education = education;
    if (preferredLanguage) user.preferredLanguage = preferredLanguage;

    await user.save();

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        education: user.education,
        preferredLanguage: user.preferredLanguage,
        role: user.role,
        xp: user.xp,
        streak: user.streak,
        hearts: user.hearts,
        dailyGoal: user.dailyGoal,
        achievements: user.achievements,
        badges: user.badges,
        unlockedLessons: user.unlockedLessons,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refill user hearts
// @route   POST /api/auth/refill-hearts
// @access  Private
exports.refillHearts = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    user.hearts = 5;
    await user.save();
    res.status(200).json({ success: true, hearts: user.hearts });
  } catch (error) {
    next(error);
  }
};


