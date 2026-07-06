const Lesson = require('../models/Lesson');
const LessonTranslation = require('../models/LessonTranslation');

// @desc    Get all lessons
// @route   GET /api/lessons
// @access  Private
exports.getLessons = async (req, res, next) => {
  try {
    const query = req.user.role === 'admin' ? {} : { status: 'published' };
    const lessons = await Lesson.find(query).populate('translations');
    res.status(200).json({ success: true, count: lessons.length, data: lessons });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single lesson by ID
// @route   GET /api/lessons/:id
// @access  Private
exports.getLesson = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate('translations');
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    if (req.user.role !== 'admin' && lesson.status !== 'published') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.status(200).json({ success: true, data: lesson });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a base lesson
// @route   POST /api/lessons
// @access  Private/Admin
exports.createLesson = async (req, res, next) => {
  try {
    const { title, description, difficulty, estimatedDuration, category, status } = req.body;

    const lesson = await Lesson.create({
      title,
      description,
      difficulty,
      estimatedDuration,
      category,
      status: status || 'draft',
      translations: [],
    });

    res.status(201).json({ success: true, data: lesson });
  } catch (error) {
    next(error);
  }
};

// @desc    Update base lesson metadata
// @route   PUT /api/lessons/:id
// @access  Private/Admin
exports.updateLesson = async (req, res, next) => {
  try {
    let lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    lesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('translations');

    res.status(200).json({ success: true, data: lesson });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a lesson
// @route   DELETE /api/lessons/:id
// @access  Private/Admin
exports.deleteLesson = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    // Delete associated translations
    await LessonTranslation.deleteMany({ lessonId: lesson._id });
    await lesson.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

// @desc    Add or update lesson translation
// @route   POST /api/lessons/:id/translations
// @access  Private/Admin
exports.addTranslation = async (req, res, next) => {
  try {
    const lessonId = req.params.id;
    const { language, title, description, learningMaterials, exercises, status } = req.body;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    // Check if translation already exists for this language
    let translation = await LessonTranslation.findOne({ lessonId, language });

    if (translation) {
      // Update existing translation
      translation.title = title;
      translation.description = description;
      translation.learningMaterials = learningMaterials;
      translation.exercises = exercises;
      translation.status = status || 'draft';
      await translation.save();
    } else {
      // Create new translation
      translation = await LessonTranslation.create({
        lessonId,
        language,
        title,
        description,
        learningMaterials,
        exercises,
        status: status || 'draft',
      });

      // Reference translation in lesson model
      lesson.translations.push(translation._id);
      await lesson.save();
    }

    res.status(200).json({ success: true, data: translation });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a translation from a lesson
// @route   DELETE /api/lessons/:id/translations/:lang
// @access  Private/Admin
exports.deleteTranslation = async (req, res, next) => {
  try {
    const { id, lang } = req.params;

    const lesson = await Lesson.findById(id);
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    const translation = await LessonTranslation.findOne({ lessonId: id, language: lang });
    if (!translation) {
      return res.status(404).json({ success: false, message: 'Translation not found' });
    }

    // Remove reference from lesson
    lesson.translations = lesson.translations.filter(
      (transId) => transId.toString() !== translation._id.toString()
    );
    await lesson.save();

    // Delete from db
    await translation.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
