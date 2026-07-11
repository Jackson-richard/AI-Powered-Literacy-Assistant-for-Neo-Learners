import React, { useContext, useEffect, useState, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  IconButton,
  Grid,
  TextField,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { AccessibilityContext } from '../context/AccessibilityContext';
import { useAxios } from '../hooks/useAxios';
import { translate } from '../utils/i18n';

const LessonReader = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const { speak, getSpeechRecognizer } = useContext(AccessibilityContext);
  const api = useAxios();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState(null);
  const [activeTranslation, setActiveTranslation] = useState(null);
  const [isFallback, setIsFallback] = useState(false);

  // Exercise responses state
  const [exerciseAnswers, setExerciseAnswers] = useState({});
  const [exerciseFeedback, setExerciseFeedback] = useState({});

  // Voice practice states
  const [listening, setListening] = useState(false);
  const [pronunciationTarget, setPronunciationTarget] = useState('');
  const [userSpeechResult, setUserSpeechResult] = useState('');
  const [speechScore, setSpeechScore] = useState(null);

  const recognitionRef = useRef(null);
  const lang = user?.preferredLanguage || 'English';

  useEffect(() => {
    const fetchLessonDetails = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/lessons/${id}`);
        const lessonData = res.data.data;
        setLesson(lessonData);

        let translation = lessonData.translations?.find(
          (t) => t.language.toLowerCase() === lang.toLowerCase()
        );

        if (!translation) {
          translation = lessonData.translations?.find((t) => t.language === 'English');
          if (translation) {
            setIsFallback(true);
          }
        }

        if (!translation) {
          translation = {
            title: lessonData.title,
            description: lessonData.description,
            learningMaterials: `
# ${lessonData.title}
${lessonData.description}

*Estimated reading duration: ${lessonData.estimatedDuration} minutes.*
            `,
            exercises: [],
          };
        }

        setActiveTranslation(translation);

        // Pick a dynamic pronunciation word based on lesson title/materials
        // Tamil/Hindi/Telugu/English specific
        const defaultTargets = {
          Tamil: 'அம்மா',
          Hindi: 'नमस्ते',
          Telugu: 'నమస్కారం',
          English: 'Hello',
        };
        setPronunciationTarget(defaultTargets[lang] || 'Welcome');
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchLessonDetails();
    }
  }, [id, api, user, lang]);

  // Set up microphone listener for voice practice
  useEffect(() => {
    const recognizer = getSpeechRecognizer(lang);
    if (recognizer) {
      recognizer.onstart = () => {
        setListening(true);
        setUserSpeechResult('');
        setSpeechScore(null);
      };
      recognizer.onend = () => setListening(false);
      recognizer.onresult = (event) => {
        const transcript = event.results[0][0].transcript.trim();
        setUserSpeechResult(transcript);
        
        // Calculate similarity score (Levenshtein distance simplified or word matches)
        const targetClean = pronunciationTarget.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g,"").trim();
        const speechClean = transcript.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g,"").trim();
        
        let score = 0;
        if (targetClean === speechClean) {
          score = 100;
        } else {
          // simple overlap match
          const targetWords = targetClean.split(' ');
          const speechWords = speechClean.split(' ');
          const matched = targetWords.filter(w => speechWords.includes(w)).length;
          score = Math.round((matched / Math.max(targetWords.length, 1)) * 100);
        }
        
        setSpeechScore(score);
      };
      recognitionRef.current = recognizer;
    }
  }, [lang, pronunciationTarget]);

  const handleToggleMic = () => {
    if (!recognitionRef.current) {
      alert('Voice check is not supported in this browser. Try Chrome/Edge.');
      return;
    }
    if (listening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleOptionChange = (idx, val) => {
    setExerciseAnswers({ ...exerciseAnswers, [idx]: val });
    setExerciseFeedback({
      ...exerciseFeedback,
      [idx]: { checked: false, correct: false },
    });
  };

  const handleCheckAnswer = (idx, correctAnswer) => {
    const selected = exerciseAnswers[idx];
    if (!selected) {
      alert('Please select an option first.');
      return;
    }

    const isCorrect = selected.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    setExerciseFeedback({
      ...exerciseFeedback,
      [idx]: { checked: true, correct: isCorrect },
    });
  };

  const handleReadLesson = () => {
    if (activeTranslation) {
      speak(activeTranslation.title + ". " + activeTranslation.description + ". " + activeTranslation.learningMaterials, lang);
    }
  };

  const renderMarkdown = (text) => {
    if (!text) return '';
    return text.split('\n').map((line, idx) => {
      let trimmed = line.trim();
      if (trimmed.startsWith('# ')) {
        return (
          <Typography key={idx} variant="h4" sx={{ fontWeight: 900, mt: 3, mb: 2, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
            {trimmed.replace('# ', '')}
          </Typography>
        );
      }
      if (trimmed.startsWith('## ')) {
        return (
          <Typography key={idx} variant="h5" sx={{ fontWeight: 800, mt: 3, mb: 1.5 }}>
            {trimmed.replace('## ', '')}
          </Typography>
        );
      }
      if (trimmed.startsWith('* ')) {
        return (
          <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: 2, mb: 1 }}>
            <Box sx={{ width: 8, height: 8, bgcolor: 'secondary.main', borderRadius: '50%' }} />
            <Typography variant="body1" sx={{ fontWeight: 600 }}>{trimmed.replace('* ', '')}</Typography>
          </Box>
        );
      }
      if (trimmed === '---') {
        return <Divider key={idx} sx={{ my: 4 }} />;
      }
      if (trimmed.includes('**')) {
        const parts = trimmed.split('**');
        return (
          <Typography key={idx} variant="body1" sx={{ mb: 2, lineHeight: 1.8, fontSize: '1.1rem', fontWeight: 500 }}>
            {parts.map((part, pIdx) => (pIdx % 2 === 1 ? <strong key={pIdx}>{part}</strong> : part))}
          </Typography>
        );
      }
      if (trimmed === '') return <Box key={idx} sx={{ height: 16 }} />;
      return (
        <Typography key={idx} variant="body1" sx={{ mb: 2, lineHeight: 1.8, fontSize: '1.1rem', fontWeight: 500 }}>
          {line}
        </Typography>
      );
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!lesson || !activeTranslation) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">Lesson details could not be loaded.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', pb: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Button variant="outlined" color="primary" startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          {translate(lang, 'goBack')}
        </Button>

        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<VolumeUpIcon />} 
          onClick={handleReadLesson}
          sx={{ px: 3, py: 1.2 }}
        >
          {translate(lang, 'ttsReadAloud')}
        </Button>
      </Box>

      {isFallback && (
        <Alert severity="info" sx={{ mb: 4, borderRadius: 3 }}>
          Materials are not available in your language. Showing fallback default English.
        </Alert>
      )}

      <Paper sx={{ p: { xs: 3, sm: 5 }, border: '2px solid #e5e5e5', borderRadius: 5 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, gap: 2 }}>
          <Box>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 900, mb: 1, letterSpacing: '-1.5px' }}>
              {activeTranslation.title}
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600 }}>
              {activeTranslation.description}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip label={lang} color="primary" sx={{ fontWeight: 800, py: 2 }} />
            <Chip label={`${lesson.estimatedDuration} min`} variant="outlined" sx={{ fontWeight: 800 }} />
          </Box>
        </Box>
        <Divider sx={{ mb: 4 }} />

        {/* Content text */}
        <Box sx={{ mb: 5 }}>
          {renderMarkdown(activeTranslation.learningMaterials)}
        </Box>

        {/* Dynamic Voice Pronunciation block */}
        <Box sx={{ mt: 5, p: 3, border: '2px dashed #00b0ff', borderRadius: 4, bgcolor: 'rgba(0, 176, 255, 0.02)' }}>
          <Typography variant="h5" sx={{ fontWeight: 900, mb: 2, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
            🗣️ {translate(lang, 'voiceCheck')}
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 700, mb: 3, fontSize: '1.25rem' }}>
            Say this word aloud: <strong style={{ color: '#58cc02', fontSize: '1.5rem' }}>{pronunciationTarget}</strong>
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Button
              variant="contained"
              color={listening ? "error" : "secondary"}
              onClick={handleToggleMic}
              startIcon={listening ? <MicOffIcon /> : <MicIcon />}
              sx={{ px: 3, py: 1.5, fontSize: '1.1rem' }}
            >
              {listening ? translate(lang, 'listening') : translate(lang, 'speakButton')}
            </Button>
            <IconButton onClick={() => speak(pronunciationTarget, lang)} title="Hear Target Audio">
              <VolumeUpIcon color="secondary" sx={{ fontSize: 32 }} />
            </IconButton>
          </Box>

          {userSpeechResult && (
            <Paper sx={{ p: 2, mb: 2, border: '1px solid #e5e5e5' }}>
              <Typography variant="subtitle2" color="text.secondary">You Spoke:</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>"{userSpeechResult}"</Typography>
            </Paper>
          )}

          {speechScore !== null && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2, borderRadius: 3, bgcolor: speechScore > 75 ? 'rgba(88,204,2,0.1)' : 'rgba(255,82,82,0.1)', color: speechScore > 75 ? 'secondary.dark' : 'error.main' }}>
              {speechScore > 75 ? (
                <>
                  <CheckCircleIcon />
                  <Typography variant="body1" sx={{ fontWeight: 800 }}>
                    {translate(lang, 'goodPronunciation')} ({speechScore}% Match)
                  </Typography>
                </>
              ) : (
                <>
                  <CancelIcon />
                  <Typography variant="body1" sx={{ fontWeight: 800 }}>
                    {translate(lang, 'badPronunciation')} ({speechScore}% Match)
                  </Typography>
                </>
              )}
            </Box>
          )}
        </Box>

        {/* Practice Exercises list */}
        {activeTranslation.exercises && activeTranslation.exercises.length > 0 && (
          <Box sx={{ mt: 6 }}>
            <Divider sx={{ mb: 4 }} />
            <Typography variant="h5" sx={{ fontWeight: 900, mb: 3, color: 'secondary.main' }}>
              🎯 Interactive Exercises
            </Typography>

            {activeTranslation.exercises.map((ex, idx) => {
              const selected = exerciseAnswers[idx] || '';
              const feedback = exerciseFeedback[idx] || { checked: false, correct: false };

              return (
                <Card key={idx} sx={{ mb: 4, border: '2px solid #e5e5e5', borderRadius: 4 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      Exercise {idx + 1}: {ex.question}
                      <IconButton size="small" onClick={() => speak(ex.question, lang)}>
                        <VolumeUpIcon fontSize="small" />
                      </IconButton>
                    </Typography>

                    {ex.options && ex.options.length > 0 ? (
                      <FormControl component="fieldset" fullWidth>
                        <RadioGroup
                          aria-label={`exercise-${idx}-options`}
                          name={`exercise-${idx}`}
                          value={selected}
                          onChange={(e) => handleOptionChange(idx, e.target.value)}
                        >
                          <Grid container spacing={2}>
                            {ex.options.map((opt, optIdx) => (
                              <Grid item xs={12} sm={6} key={optIdx}>
                                <Paper
                                  sx={{
                                    px: 2.5,
                                    py: 1.5,
                                    borderRadius: 3,
                                    border: '2px solid',
                                    borderColor: selected === opt ? 'primary.main' : '#e5e5e5',
                                    bgcolor: selected === opt ? 'rgba(0,176,255,0.03)' : 'transparent',
                                    '&:hover': { borderColor: 'primary.light' },
                                  }}
                                >
                                  <FormControlLabel
                                    value={opt}
                                    control={<Radio color="primary" />}
                                    label={opt}
                                    sx={{ width: '100%', m: 0 }}
                                  />
                                </Paper>
                              </Grid>
                            ))}
                          </Grid>
                        </RadioGroup>
                      </FormControl>
                    ) : (
                      <TextField
                        fullWidth
                        label="Type answer"
                        value={selected}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                      />
                    )}

                    {feedback.checked && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 3, p: 2, borderRadius: 3, bgcolor: feedback.correct ? 'rgba(88,204,2,0.1)' : 'rgba(255,82,82,0.1)', color: feedback.correct ? 'secondary.dark' : 'error.main' }}>
                        {feedback.correct ? (
                          <>
                            <CheckCircleIcon />
                            <Typography variant="body1" sx={{ fontWeight: 800 }}>Correct! Excellent Job!</Typography>
                          </>
                        ) : (
                          <>
                            <CancelIcon />
                            <Typography variant="body1" sx={{ fontWeight: 800 }}>Incorrect. Try again! Correct answer is: {ex.correctAnswer}</Typography>
                          </>
                        )}
                      </Box>
                    )}

                    <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                      <Button
                        variant="contained"
                        color="secondary"
                        disabled={!selected}
                        onClick={() => handleCheckAnswer(idx, ex.correctAnswer)}
                      >
                        {translate(lang, 'checkAnswer')}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default LessonReader;
