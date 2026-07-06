const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Curriculum = require('../models/Curriculum');
const Lesson = require('../models/Lesson');
const LessonTranslation = require('../models/LessonTranslation');
const Assessment = require('../models/Assessment');
const Question = require('../models/Question');
const Response = require('../models/Response');
const Result = require('../models/Result');

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/literacy_assistant'
    );
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany();
    await Curriculum.deleteMany();
    await Lesson.deleteMany();
    await LessonTranslation.deleteMany();
    await Assessment.deleteMany();
    await Question.deleteMany();
    await Response.deleteMany();
    await Result.deleteMany();

    console.log('Cleaned old records successfully.');

    // 1. Create Users
    const adminUser = await User.create({
      name: 'Admin Instructor',
      email: 'admin@literacy.com',
      password: 'admin123', // Will be hashed via User.pre('save')
      age: 35,
      education: 'Master of Education',
      preferredLanguage: 'English',
      role: 'admin',
    });

    const learnerUser = await User.create({
      name: 'Rohan Kumar',
      email: 'learner@literacy.com',
      password: 'learner123',
      age: 22,
      education: 'Primary Schooling',
      preferredLanguage: 'Hindi',
      role: 'learner',
    });

    console.log('Seed: Created Admin and Learner users.');

    // 2. Create Lessons
    // Lesson 1: Vowels and Alphabet
    const lesson1 = await Lesson.create({
      title: 'Alphabet & Vowel Basics',
      description: 'Learn fundamental sounds, vowels, and basic pronunciations.',
      difficulty: 'Beginner',
      estimatedDuration: 15,
      category: 'Alphabet',
      status: 'published',
    });

    // Translations for Lesson 1
    const trans1En = await LessonTranslation.create({
      lessonId: lesson1._id,
      language: 'English',
      title: 'Alphabet & Vowel Basics',
      description: 'Learn fundamental sounds, vowels, and basic pronunciations.',
      learningMaterials: `
# English Vowel Basics
In English, there are 26 letters in the alphabet. Among these, **5 are vowels**:
* **A** (as in Apple)
* **E** (as in Egg)
* **I** (as in Ink)
* **O** (as in Orange)
* **U** (as in Umbrella)

All other letters are called **consonants** (e.g., B, C, D, F, G). Vowels are essential because they form the core sound of almost every word.
      `,
      exercises: [
        {
          question: 'Which of the following is an English vowel?',
          options: ['B', 'C', 'E', 'D'],
          correctAnswer: 'E',
        },
      ],
      status: 'published',
    });

    const trans1Hi = await LessonTranslation.create({
      lessonId: lesson1._id,
      language: 'Hindi',
      title: 'वर्णमाला और स्वर की बुनियादी बातें',
      description: 'बुनियादी ध्वनियों, स्वरों और मूल उच्चारणों को सीखें।',
      learningMaterials: `
# हिंदी स्वर की बुनियादी बातें
हिंदी वर्णमाला में दो प्रकार के वर्ण होते हैं: स्वर और व्यंजन। **स्वर** वे वर्ण होते हैं जिनका उच्चारण स्वतंत्र रूप से किया जाता है:
* **अ** (अक्षर)
* **आ** (आम)
* **इ** (इमली)
* **ई** (ईख)
* **उ** (उल्लू)
* **ऊ** (ऊन)

ये स्वर शब्दों में मात्राओं का आधार बनते हैं।
      `,
      exercises: [
        {
          question: 'इनमें से कौन सा एक स्वर वर्ण है?',
          options: ['क', 'ख', 'अ', 'ग'],
          correctAnswer: 'अ',
        },
      ],
      status: 'published',
    });

    const trans1Ta = await LessonTranslation.create({
      lessonId: lesson1._id,
      language: 'Tamil',
      title: 'எழுத்துக்கள் மற்றும் உயிரெழுத்துக்கள்',
      description: 'அடிப்படை ஒலிகள் மற்றும் உச்சரிப்புகளைக் கற்றுக்கொள்ளுங்கள்.',
      learningMaterials: `
# தமிழ் உயிரெழுத்துக்கள்
தமிழ் மொழியில் உயிரெழுத்துக்கள் **12** உள்ளன. இவை மொழியின் அடிப்படையான ஒலிகளை உருவாக்குகின்றன:
* **அ** (அம்மா)
* **ஆ** (ஆடு)
* **இ** (இலை)
* **ஈ** (ஈட்டி)

உயிரெழுத்துக்கள் பிற மெய்யெழுத்துக்களுடன் இணைந்து உயிர்மெய் எழுத்துக்களை உருவாக்குகின்றன.
      `,
      exercises: [
        {
          question: 'பின்வருவனவற்றில் உயிரெழுத்து எது?',
          options: ['க்', 'ச்', 'அ', 'த்'],
          correctAnswer: 'அ',
        },
      ],
      status: 'published',
    });

    const trans1Kn = await LessonTranslation.create({
      lessonId: lesson1._id,
      language: 'Kannada',
      title: 'ವರ್ಣಮಾಲೆ ಮತ್ತು ಸ್ವರಗಳ ಮೂಲಗಳು',
      description: 'ಮೂಲಭೂತ ಧ್ವನಿಗಳು ಮತ್ತು ಉಚ್ಚಾರಣೆಗಳನ್ನು ಕಲಿಯಿರಿ.',
      learningMaterials: `
# ಕನ್ನಡ ಸ್ವರಗಳು
ಕನ್ನಡ ವರ್ಣಮಾಲೆಯಲ್ಲಿ ಪ್ರಮುಖವಾಗಿ **ಸ್ವರಗಳು** ಸ್ವತಂತ್ರವಾಗಿ ಉಚ್ಚರಿಸಬಹುದಾದ ಅಕ್ಷರಗಳಾಗಿವೆ:
* **ಅ** (ಅಮ್ಮ)
* **ಆ** (ಆನೆ)
* **ಇ** (ಇಲಿ)
* **ಈ** (ಈಶ್ವರ)

ಈ ಅಕ್ಷರಗಳು ಕನ್ನಡ ಭಾಷೆಯ ಉಚ್ಚಾರಣೆಗೆ ಅಡಿಪಾಯವಾಗಿವೆ.
      `,
      exercises: [
        {
          question: 'ಇವುಗಳಲ್ಲಿ ಸ್ವರ ಅಕ್ಷರ ಯಾವುದು?',
          options: ['ಕ್', 'ಚ್', 'ಅ', 'ತ್'],
          correctAnswer: 'ಅ',
        },
      ],
      status: 'published',
    });

    // Save translation references back to lesson 1
    lesson1.translations.push(trans1En._id, trans1Hi._id, trans1Ta._id, trans1Kn._id);
    await lesson1.save();

    // Lesson 2: Word Formations
    const lesson2 = await Lesson.create({
      title: 'Constructing Simple Words',
      description: 'Learn to combine individual letters to form simple common nouns.',
      difficulty: 'Beginner',
      estimatedDuration: 20,
      category: 'Words',
      status: 'published',
    });

    // Translations for Lesson 2
    const trans2En = await LessonTranslation.create({
      lessonId: lesson2._id,
      language: 'English',
      title: 'Constructing Simple Words',
      description: 'Learn to combine individual letters to form simple common nouns.',
      learningMaterials: `
# Combining Letters
When we join consonants and vowels together, we create **words**:
* **C-A-T** spell **CAT** (a pet that meows)
* **D-O-G** spell **DOG** (a pet that barks)
* **P-E-N** spell **PEN** (an object used to write)

Practicing spelling helps in reading complete sentences.
      `,
      exercises: [
        {
          question: 'What does C-A-T spell?',
          options: ['DOG', 'CAT', 'BAT', 'RAT'],
          correctAnswer: 'CAT',
        },
      ],
      status: 'published',
    });

    const trans2Hi = await LessonTranslation.create({
      lessonId: lesson2._id,
      language: 'Hindi',
      title: 'सरल शब्द रचना',
      description: 'सरल सामान्य संज्ञा बनाने के लिए अलग-अलग अक्षरों को जोड़ना सीखें।',
      learningMaterials: `
# दो अक्षरों वाले शब्द
जब हम दो या अधिक वर्णों को जोड़ते हैं, तो **शब्द** बनते हैं:
* **न + ल = नल** (पानी का स्रोत)
* **फ + ल = फल** (खाने योग्य मीठा फल)
* **ज + ल = जल** (पानी)

इन सरल शब्दों को पढ़ना वाक्य निर्माण की पहली सीढ़ी है।
      `,
      exercises: [
        {
          question: 'न और ल को जोड़ने पर क्या शब्द बनता है?',
          options: ['फल', 'जल', 'नल', 'कल'],
          correctAnswer: 'नल',
        },
      ],
      status: 'published',
    });

    const trans2Ta = await LessonTranslation.create({
      lessonId: lesson2._id,
      language: 'Tamil',
      title: 'எளிய சொற்களை உருவாக்குதல்',
      description: 'எழுத்துக்களை இணைத்து எளிய சொற்களை உருவாக்கக் கற்றுக்கொள்ளுங்கள்.',
      learningMaterials: `
# சொற்கள் அறிவோம்
எழுத்துக்கள் ஒன்றுடன் ஒன்று சேரும்போது **சொற்கள்** உருவாகின்றன:
* **ப - ட - ம் = படம்** (ஓவியம் அல்லது ஒளிப்படம்)
* **ம - ர - ம் = மரம்** (இயற்கை தாவரம்)
* **ப - ல் = பல்** (உடலின் ஒரு பகுதி)
      `,
      exercises: [
        {
          question: 'ப, ட, ம் ஆகிய எழுத்துக்களை இணைத்தால் வரும் சொல் எது?',
          options: ['அம்மா', 'படம்', 'மரம்', 'பல்'],
          correctAnswer: 'படம்',
        },
      ],
      status: 'published',
    });

    const trans2Kn = await LessonTranslation.create({
      lessonId: lesson2._id,
      language: 'Kannada',
      title: 'ಸರಳ ಪದಗಳ ರಚನೆ',
      description: 'ಸರಳ ಪದಗಳನ್ನು ರೂಪಿಸಲು ಅಕ್ಷರಗಳನ್ನು ಜೋಡಿಸುವುದನ್ನು ಕಲಿಯಿರಿ.',
      learningMaterials: `
# ಅಕ್ಷರಗಳನ್ನು ಸೇರಿಸಿ ಪದ ಮಾಡುವುದು
ಅಕ್ಷರಗಳನ್ನು ಜೋಡಿಸುವುದರಿಂದ **ಪದಗಳು** ಸೃಷ್ಟಿಯಾಗುತ್ತವೆ:
* **ಮ + ರ = ಮರ** (ಗಿಡದ ದೊಡ್ಡ ರೂಪ)
* **ಹ + ಲ + ಗೆ = ಹಲಗೆ** (ಬರೆಯಲು ಬಳಸುವ ಬೋರ್ಡ್)
* **ಮ + ನೆ = ಮನೆ** (ವಾಸಿಸುವ ಸ್ಥಳ)
      `,
      exercises: [
        {
          question: 'ಮ ಮತ್ತು ರ ಅಕ್ಷರಗಳನ್ನು ಸೇರಿಸಿದರೆ ಯಾವ ಪದವಾಗುತ್ತದೆ?',
          options: ['ಮನೆ', 'ಮರ', 'ಹಲಗೆ', 'ಬಾಗಿಲು'],
          correctAnswer: 'ಮರ',
        },
      ],
      status: 'published',
    });

    lesson2.translations.push(trans2En._id, trans2Hi._id, trans2Ta._id, trans2Kn._id);
    await lesson2.save();

    console.log('Seed: Created Lessons and Translations.');

    // 3. Create Curriculum
    const curriculum = await Curriculum.create({
      title: 'Foundational Literacy Pathway',
      description: 'A comprehensive curriculum designed to teach basic alphabet recognition, sound phonics, and simple word construction.',
      difficulty: 'Beginner',
      order: 1,
      status: 'published',
      lessons: [lesson1._id, lesson2._id],
    });

    console.log('Seed: Created Curriculum.');

    // 4. Create Assessment and Questions
    const assessment = await Assessment.create({
      title: 'Introduction to Literacy Assessment',
      description: 'Evaluate your reading, writing, and comprehension skills based on the introductory units.',
      type: 'Comprehension',
      difficulty: 'Beginner',
      status: 'published',
      questions: [],
    });

    const q1 = await Question.create({
      assessmentId: assessment._id,
      type: 'Reading',
      text: "Read the alphabet list. Identify the uppercase character that sounds like 'Bee':",
      options: ['D', 'B', 'P', 'Q'],
      correctAnswer: 'B',
      difficulty: 'Beginner',
      points: 20,
    });

    const q2 = await Question.create({
      assessmentId: assessment._id,
      type: 'Writing',
      text: "Choose the correct missing vowel letter to complete the word for a meowing pet: 'C _ T'",
      options: ['A', 'E', 'I', 'O'],
      correctAnswer: 'A',
      difficulty: 'Beginner',
      points: 20,
    });

    const q3 = await Question.create({
      assessmentId: assessment._id,
      type: 'Comprehension',
      text: "Read this sentence: 'The cat sat on the soft mat.' Question: Where did the cat sit?",
      options: ['On the table', 'On the soft mat', 'On the floor', 'Outside'],
      correctAnswer: 'On the soft mat',
      difficulty: 'Beginner',
      points: 20,
    });

    assessment.questions.push(q1._id, q2._id, q3._id);
    await assessment.save();

    console.log('Seed: Created Assessment & Questions.');

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  }
};

seed();
