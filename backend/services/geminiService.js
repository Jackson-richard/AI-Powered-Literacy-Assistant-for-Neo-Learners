const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY;
let ai = null;
let model = null;

if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY') {
  try {
    ai = new GoogleGenerativeAI(apiKey);
    // Use gemini-1.5-flash as default high-performance lightweight model
    model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    console.log('Gemini AI Service initialized successfully.');
  } catch (error) {
    console.error('Error initializing Gemini AI:', error.message);
  }
} else {
  console.warn('WARNING: GEMINI_API_KEY is missing or unset. Running Gemini Service in MOCK mode.');
}

/**
 * Patient literacy tutor conversation chat
 */
exports.tutorChat = async (message, history = [], language = 'English', level = 'Beginner') => {
  if (!model) {
    return getMockTutorResponse(message, language, level);
  }

  try {
    const formattedHistory = history.map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }]
    }));

    const systemPrompt = `You are a patient, warm, and highly supportive AI literacy tutor named "Gyan" designed specifically for older adults and Neo-Learners.
Your student is learning ${language} and is currently at a ${level} level.
Always respond in ${language} (using native script e.g., Devanagari for Hindi, Tamil script for Tamil, Telugu script for Telugu).
Keep your sentences very short, clear, and easy to read. Avoid complex grammar or vocabulary.
Offer guidance, encourage them warmly, and use emojis to make the learning experience friendly and rewarding.`;

    const chat = model.startChat({
      history: formattedHistory,
      systemInstruction: systemPrompt,
    });

    const result = await chat.sendMessage(message);
    return result.response.text();
  } catch (error) {
    console.error('Gemini chat error, falling back to mock:', error);
    return getMockTutorResponse(message, language, level);
  }
};

/**
 * Generates a structured lesson with content and practice questions
 */
exports.generateLesson = async (language, difficulty, category) => {
  const prompt = `Generate a structured language lesson for learning ${language}.
Difficulty level: ${difficulty}
Topic/Category: ${category}

Ensure the output is valid JSON in this exact structure:
{
  "title": "A short engaging lesson title in ${language}",
  "description": "A simple description in ${language}",
  "learningMaterials": "Detailed study content written in ${language}. Use Markdown for headers (# and ##), bullet points, and bold text. Keep sentences extremely simple and tailored to a ${difficulty} Neo-Learner.",
  "exercises": [
    {
      "question": "A multiple choice practice question in ${language} testing the materials",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option C (the correct option, matching exactly one of the options)"
    }
  ]
}

Return ONLY the raw JSON object inside a codeblock or directly. Do not include markdown wraps besides the json itself.`;

  if (!model) {
    return JSON.parse(getMockLesson(language, difficulty, category));
  }

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    });
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error('Gemini generateLesson error, falling back:', error);
    return JSON.parse(getMockLesson(language, difficulty, category));
  }
};

/**
 * Generates a set of dynamic assessment questions targeting weakness areas
 */
exports.generateSmartAssessment = async (language, difficulty, previousMistakes = []) => {
  const mistakesContext = previousMistakes.length > 0
    ? `The learner recently made mistakes on these areas: ${previousMistakes.join(', ')}. Focus on reinforcing these points.`
    : `Generate general foundational exercises.`;

  const prompt = `Generate a set of 5 multiple-choice questions for a language assessment in ${language} at ${difficulty} level.
${mistakesContext}

Ensure the output is a JSON array of 5 objects matching this exact structure:
[
  {
    "type": "Reading" or "Writing" or "Comprehension",
    "text": "The question text in ${language}",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correctAnswer": "Option 2 (the correct choice, matching exactly)",
    "difficulty": "${difficulty}",
    "points": 10
  }
]

Return ONLY the raw JSON array.`;

  if (!model) {
    return JSON.parse(getMockAssessment(language, difficulty));
  }

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    });
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error('Gemini generateSmartAssessment error, falling back:', error);
    return JSON.parse(getMockAssessment(language, difficulty));
  }
};

/**
 * Generates a simple reading story with comprehension checks
 */
exports.generateStory = async (language, level = 'Beginner') => {
  const prompt = `Generate a very short, simple story in ${language} suitable for a ${level} adult literacy learner.
Focus on topics like daily situations, community, family, shopping, or farming.

Return a JSON object in this exact format:
{
  "title": "Story Title in ${language}",
  "storyText": "Simple story text in ${language}. Use short paragraphs. Use basic words.",
  "translation": "English translation of the story text",
  "comprehensionQuestions": [
    {
      "question": "A comprehension question about the story, written in ${language}",
      "options": ["Opt 1", "Opt 2", "Opt 3", "Opt 4"],
      "correctAnswer": "Opt 1"
    }
  ]
}

Return ONLY the raw JSON.`;

  if (!model) {
    return JSON.parse(getMockStory(language, level));
  }

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    });
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error('Gemini generateStory error, falling back:', error);
    return JSON.parse(getMockStory(language, level));
  }
};

/**
 * Analyzes previous student records to detect weaknesses and generate recommendations
 */
exports.detectWeaknessesAndRecommend = async (resultsHistory = [], language = 'English') => {
  if (resultsHistory.length === 0) {
    return {
      weaknesses: ['Vowel Recognition', 'Basic Spelling'],
      recommendations: ['Practice basic alphabet cards', 'Complete Lesson 1 Review'],
      summary: 'Welcome! Complete your first assessment so I can analyze your focus areas. Keep up the good work! 👍'
    };
  }

  const scoresFormatted = resultsHistory.map(r =>
    `Assessment: ${r.assessmentId?.title || 'Quiz'} | Overall Score: ${r.scores?.overall}% | Reading: ${r.scores?.reading}% | Writing: ${r.scores?.writing}% | Comprehension: ${r.scores?.comprehension}%`
  ).join('\n');

  const prompt = `Analyze these student test results:
${scoresFormatted}

Generate an analysis of their weaknesses and learning recommendations in ${language}.
Format as JSON:
{
  "weaknesses": ["Weakness 1", "Weakness 2"],
  "recommendations": ["Recommended action 1", "Recommended action 2"],
  "summary": "A friendly, encouraging summary paragraph in ${language} addressed directly to the learner, highlighting progress and where to focus."
}

Return ONLY JSON.`;

  if (!model) {
    return getMockRecommendations(resultsHistory, language);
  }

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    });
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error('Gemini detectWeaknessesAndRecommend error, falling back:', error);
    return getMockRecommendations(resultsHistory, language);
  }
};

/**
 * Generates daily review exercises
 */
exports.generateDailyPlan = async (language, level = 'Beginner') => {
  const prompt = `Generate a customized daily study checklist of 3 tasks in ${language} for a ${level} literacy learner.
Return as JSON array:
[
  { "task": "Checklist task description in ${language}", "completed": false, "xpReward": 15 },
  ...
]`;

  if (!model) {
    return getMockDailyPlan(language, level);
  }

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    });
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error('Gemini generateDailyPlan error, falling back:', error);
    return getMockDailyPlan(language, level);
  }
};


// ==================== MOCK FALLBACK DATA GENERATORS ====================

function getMockTutorResponse(message, language, level) {
  const responses = {
    Tamil: `வணக்கம்! 🌟 நீங்கள் நன்றாகப் படிக்கிறீர்கள். "${message}" என்பது அருமையான கேள்வி. தமிழ் எழுத்துக்களைத் தினமும் பயிற்சி செய்யுங்கள், வெற்றி நிச்சயம்! ✍️`,
    Hindi: `नमस्ते! 🌟 आप बहुत अच्छा प्रयास कर रहे हैं। "${message}" एक बहुत अच्छा सवाल है। हर दिन थोड़ा अभ्यास करें, आप बहुत आगे जाएंगे! ✍️`,
    Telugu: `నమస్కారం! 🌟 మీరు చాలా బాగా చదువుతున్నారు. "${message}" అనేది చక్కటి ప్రశ్న. ప్రతిరోజూ అక్షరాలను సాధన చేయండి, తప్పక విజయం సాధిస్తారు! ✍️`,
    English: `Hello! 🌟 You are doing an amazing job. "${message}" is an excellent question. Keep practicing every day, you will master it! ✍️`
  };
  return responses[language] || responses['English'];
}

function getMockLesson(language, difficulty, category) {
  const lessons = {
    Tamil: JSON.stringify({
      title: 'தமிழ் எழுத்துக்கள் அறிமுகம்',
      description: 'தமிழ் உயிர் எழுத்துக்களை அறிந்துகொள்ளுங்கள்.',
      learningMaterials: `
# தமிழ் உயிர் எழுத்துக்கள்
தமிழ் மொழியின் அடிப்படையான உயிர் எழுத்துக்கள் 12 ஆகும்:
* **அ** (அம்மா)
* **ஆ** (ஆடு)
* **இ** (இலை)
* **ஈ** (ஈட்டி)

உயிரெழுத்துக்கள் மிக முக்கியமானவை. இவை சொற்களுக்கு உயிர் கொடுக்கின்றன.
      `,
      exercises: [
        {
          question: 'உயிரெழுத்துக்களில் முதல் எழுத்து எது?',
          options: ['ஆ', 'இ', 'அ', 'உ'],
          correctAnswer: 'அ'
        }
      ]
    }),
    Hindi: JSON.stringify({
      title: 'हिंदी स्वर वर्ण',
      description: 'हिंदी वर्णमाला के स्वरों को सीखें।',
      learningMaterials: `
# हिंदी स्वर
हिंदी वर्णमाला में स्वरों का विशेष स्थान है। मुख्य स्वर निम्नलिखित हैं:
* **अ** (अनार)
* **आ** (आम)
* **इ** (इमली)
* **ई** (ईख)

स्वर शब्दों को मात्राएं प्रदान करते हैं।
      `,
      exercises: [
        {
          question: 'इनमें से स्वर कौन सा है?',
          options: ['क', 'ख', 'अ', 'ग'],
          correctAnswer: 'अ'
        }
      ]
    }),
    Telugu: JSON.stringify({
      title: 'తెలుగు అచ్చులు పరిచయం',
      description: 'తెలుగు భాషలోని అచ్చులను నేర్చుకోండి.',
      learningMaterials: `
# తెలుగు అచ్చులు
తెలుగు వర్ణమాలలో మొదటి భాగం అచ్చులు. ఇవి స్వతంత్రంగా పలికే అక్షరాలు:
* **అ** (అమ్మ)
* **ఆ** (ఆవు)
* **ఇ** (ఇల్లు)
* **ఈ** (ఈల)

తెలుగు అచ్చులు పదాల నిర్మాణానికి మూలాధారం.
      `,
      exercises: [
        {
          question: 'కింది వాటిలో అచ్చు ఏది?',
          options: ['క', 'అ', 'చ', 'ట'],
          correctAnswer: 'అ'
        }
      ]
    }),
    English: JSON.stringify({
      title: 'English Alphabets & Vowels',
      description: 'Learn the basic structure of English vowels.',
      learningMaterials: `
# English Vowels
The English alphabet has 26 letters, including 5 vowels:
* **A** (Apple)
* **E** (Egg)
* **I** (Ink)
* **O** (Orange)
* **U** (Umbrella)

Consonants are the rest of the letters.
      `,
      exercises: [
        {
          question: 'Which of the following is a vowel?',
          options: ['B', 'M', 'A', 'Z'],
          correctAnswer: 'A'
        }
      ]
    })
  };

  return lessons[language] || lessons['English'];
}

function getMockAssessment(language, difficulty) {
  const mockQuestions = {
    Tamil: JSON.stringify([
      { type: 'Reading', text: 'கீழே உள்ளவற்றில் உயிர் எழுத்து எது?', options: ['க்', 'ச்', 'அ', 'ப்'], correctAnswer: 'அ', difficulty, points: 10 },
      { type: 'Writing', text: 'அம்மா என்ற வார்த்தையின் முதல் எழுத்து என்ன?', options: ['ஆ', 'அ', 'இ', 'உ'], correctAnswer: 'அ', difficulty, points: 10 },
      { type: 'Comprehension', text: 'இலை என்பது ஒரு மரத்தின் பாகம். கேள்வி: இலை எங்கு இருக்கும்?', options: ['வேரில்', 'மரத்தின் கிளையில்', 'மண்ணில்', 'வானத்தில்'], correctAnswer: 'மரத்தின் கிளையில்', difficulty, points: 10 },
      { type: 'Reading', text: 'ஆடு என்பது ஒரு வீட்டு விலங்கு. அதன் முதல் எழுத்து எது?', options: ['அ', 'ஆ', 'ஒ', 'ஓ'], correctAnswer: 'ஆ', difficulty, points: 10 },
      { type: 'Comprehension', text: 'படம் என்ற சொல்லில் உள்ள மெய்யெழுத்து எது?', options: ['ப', 'ட', 'ம்', 'அ'], correctAnswer: 'ம்', difficulty, points: 10 }
    ]),
    Hindi: JSON.stringify([
      { type: 'Reading', text: 'इनमें से स्वर वर्ण कौन सा है?', options: ['क', 'च', 'अ', 'ट'], correctAnswer: 'अ', difficulty, points: 10 },
      { type: 'Writing', text: 'आम शब्द का पहला वर्ण कौन सा है?', options: ['अ', 'आ', 'इ', 'उ'], correctAnswer: 'आ', difficulty, points: 10 },
      { type: 'Comprehension', text: 'फल मीठा होता है। प्रश्न: फल का स्वाद कैसा होता है?', options: ['कड़वा', 'नमकीन', 'मीठा', 'खट्टा'], correctAnswer: 'मीठा', difficulty, points: 10 },
      { type: 'Reading', text: 'नल से पानी आता है। प्रश्न: नल से क्या आता है?', options: ['दूध', 'तेल', 'पानी', 'जूस'], correctAnswer: 'पानी', difficulty, points: 10 },
      { type: 'Comprehension', text: 'कलम से लिखते हैं। प्रश्न: लिखने के लिए किसका उपयोग होता है?', options: ['कलम', 'किताब', 'नल', 'फल'], correctAnswer: 'कलम', difficulty, points: 10 }
    ]),
    Telugu: JSON.stringify([
      { type: 'Reading', text: 'కింది వాటిలో అచ్చు అక్షరం ఏది?', options: ['క', 'చ', 'అ', 'త'], correctAnswer: 'అ', difficulty, points: 10 },
      { type: 'Writing', text: 'అమ్మ అనే పదంలో మొదటి అక్షరం ఏది?', options: ['ఆ', 'అ', 'ఇ', 'ఉ'], correctAnswer: 'అ', difficulty, points: 10 },
      { type: 'Comprehension', text: 'ఆవు మనకు పాలు ఇస్తుంది. ప్రశ్న: ఆవు ఏమి ఇస్తుంది?', options: ['నీరు', 'పాలు', 'పండ్లు', 'నూనె'], correctAnswer: 'పాలు', difficulty, points: 10 },
      { type: 'Reading', text: 'ఇల్లు అనేది మనం నివసించే చోటు. ప్రశ్న: ఇల్లు లో మొదటి అక్షరం ఏది?', options: ['అ', 'ఆ', 'ఇ', 'ఈ'], correctAnswer: 'ఇ', difficulty, points: 10 },
      { type: 'Comprehension', text: 'మరం అంటే చెట్టు. ప్రశ్న: మరం కు మరో పేరు ఏమిటి?', options: ['ఇల్లు', 'చెట్టు', 'ఆవు', 'నీరు'], correctAnswer: 'చెట్టు', difficulty, points: 10 }
    ]),
    English: JSON.stringify([
      { type: 'Reading', text: 'Which letter is a vowel?', options: ['C', 'T', 'O', 'G'], correctAnswer: 'O', difficulty, points: 10 },
      { type: 'Writing', text: 'What is the missing vowel in: C _ T (meows)?', options: ['E', 'I', 'O', 'A'], correctAnswer: 'A', difficulty, points: 10 },
      { type: 'Comprehension', text: 'The sun rises in the east. Question: Where does the sun rise?', options: ['West', 'East', 'North', 'South'], correctAnswer: 'East', difficulty, points: 10 },
      { type: 'Reading', text: 'Identify the capital letter for sound "d":', options: ['B', 'P', 'D', 'Q'], correctAnswer: 'D', difficulty, points: 10 },
      { type: 'Comprehension', text: 'A pen is used for writing. Question: What do we do with a pen?', options: ['Eat', 'Drink', 'Write', 'Play'], correctAnswer: 'Write', difficulty, points: 10 }
    ])
  };

  return mockQuestions[language] || mockQuestions['English'];
}

function getMockStory(language, level) {
  const stories = {
    Tamil: JSON.stringify({
      title: 'ராமுவும் அவரது பசுவும்',
      storyText: 'ராமு ஒரு விவசாயி. அவரிடம் ஒரு வெள்ளை பசு இருந்தது. அது தினமும் நிறைய இனிமையான பால் தந்தது. ராமு அதை அன்பாக கவனித்துக்கொண்டார்.',
      translation: 'Ramu and his cow. Ramu is a farmer. He had a white cow. It gave lots of sweet milk every day. Ramu took care of it lovingly.',
      comprehensionQuestions: [
        {
          question: 'ராமுவிடம் இருந்த பசுவின் நிறம் என்ன?',
          options: ['கருப்பு', 'வெள்ளை', 'சிவப்பு', 'பழுப்பு'],
          correctAnswer: 'வெள்ளை'
        }
      ]
    }),
    Hindi: JSON.stringify({
      title: 'रामू और उसकी गाय',
      storyText: 'रामू एक किसान है। उसके पास एक सफेद गाय है। गाय हर दिन मीठा दूध देती है। रामू उसे बहुत प्यार करता है और रोज चारा खिलाता है।',
      translation: 'Ramu and his cow. Ramu is a farmer. He has a white cow. The cow gives sweet milk every day. Ramu loves it and feeds it daily.',
      comprehensionQuestions: [
        {
          question: 'गाय का रंग कैसा है?',
          options: ['काली', 'सफेद', 'लाल', 'चितकबरी'],
          correctAnswer: 'सफेद'
        }
      ]
    }),
    Telugu: JSON.stringify({
      title: 'రాము మరియు అతని ఆవు',
      storyText: 'రాము ఒక రైతు. అతని వద్ద ఒక తెల్లని ఆవు ఉంది. ఆ ఆవు ప్రతిరోజూ తీపి పాలు ఇస్తుంది. రాము దానికి ప్రతిరోజూ పచ్చని గడ్డి వేస్తాడు.',
      translation: 'Ramu and his cow. Ramu is a farmer. He has a white cow. The cow gives sweet milk every day. Ramu feeds it green grass daily.',
      comprehensionQuestions: [
        {
          question: 'ఆవు రంగు ఏమిటి?',
          options: ['నలుపు', 'తెలుపు', 'ఎరుపు', 'గోధుమ'],
          correctAnswer: 'తెలుపు'
        }
      ]
    }),
    English: JSON.stringify({
      title: 'Ramu and his Cow',
      storyText: 'Ramu is a farmer. He has a beautiful white cow. The cow gives sweet milk every day. Ramu feeds the cow fresh grass and loves it very much.',
      translation: 'English story version',
      comprehensionQuestions: [
        {
          question: 'What color is Ramu\'s cow?',
          options: ['Black', 'Brown', 'White', 'Grey'],
          correctAnswer: 'White'
        }
      ]
    })
  };

  return stories[language] || stories['English'];
}

function getMockRecommendations(resultsHistory, language) {
  const summaries = {
    Tamil: 'அருமையான முயற்சி! நீங்கள் வாசிப்புப் பயிற்சியில் நல்ல மதிப்பெண்கள் பெற்றுள்ளீர்கள். இன்னும் மெய்யெழுத்துக்களை எழுதுவதில் கவனம் செலுத்த வேண்டும். தொடர்ந்து பயிற்சி செய்யுங்கள்! 👍',
    Hindi: 'बहुत बढ़िया प्रयास! आपने पठन कौशल में बहुत अच्छा प्रदर्शन किया है। अब आपको वर्णों को जोड़ने और शब्दावली बढ़ाने पर ध्यान देना चाहिए। आगे बढ़ते रहें! 👍',
    Telugu: 'చక్కటి ప్రయత్నం! మీరు చదవడం విభాగంలో మంచి మార్కులు సాధించారు. అక్షరాల కలయికలను మరియు పదాల రచనను మరింతగా సాధన చేయండి. ముందడుగు వేయండి! 👍',
    English: 'Great effort! You did really well in the Reading section. Let us focus a bit more on word combinations and spelling exercises next. Keep it up! 👍'
  };

  return {
    weaknesses: ['Spelling Patterns', 'Vowel Quantifiers'],
    recommendations: ['Review basic matching exercise', 'Practice vocabulary cards', 'Complete Word Formation lesson'],
    summary: summaries[language] || summaries['English']
  };
}

function getMockDailyPlan(language, level) {
  const plans = {
    Tamil: [
      { task: '5 உயிர் எழுத்துக்களை உச்சரிக்கவும்', completed: false, xpReward: 15 },
      { task: 'எளிய வார்த்தை பொருத்தப் பயிற்சி', completed: false, xpReward: 10 },
      { task: 'AI பயிற்சியாளருடன் உரையாடவும்', completed: false, xpReward: 20 }
    ],
    Hindi: [
      { task: '5 स्वरों का सही उच्चारण करें', completed: false, xpReward: 15 },
      { task: 'शब्द-चित्र मिलान खेल पूरा करें', completed: false, xpReward: 10 },
      { task: 'ट्यूटर चैट में बातचीत करें', completed: false, xpReward: 20 }
    ],
    Telugu: [
      { task: '5 అచ్చులను స్పష్టంగా ఉచ్చరించండి', completed: false, xpReward: 15 },
      { task: 'పద చిత్రాల సరిపోలిక పూర్తి చేయండి', completed: false, xpReward: 10 },
      { task: 'AI ట్యూటర్ తో సంభాషించండి', completed: false, xpReward: 20 }
    ],
    English: [
      { task: 'Pronounce 5 basic vowel sounds', completed: false, xpReward: 15 },
      { task: 'Complete a picture matching card', completed: false, xpReward: 10 },
      { task: 'Have a short chat with Gyan the Owl', completed: false, xpReward: 20 }
    ]
  };

  return plans[language] || plans['English'];
}
