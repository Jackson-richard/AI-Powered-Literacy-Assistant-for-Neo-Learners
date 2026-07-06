import React, { useContext, useEffect, useState } from 'react';
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
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useAxios } from '../hooks/useAxios';

const LessonReader = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const api = useAxios();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState(null);
  const [activeTranslation, setActiveTranslation] = useState(null);
  const [isFallback, setIsFallback] = useState(false);

  // Exercise responses state
  // key: exerciseIndex, value: selectedAnswer
  const [exerciseAnswers, setExerciseAnswers] = useState({});
  // key: exerciseIndex, value: { checked: boolean, correct: boolean }
  const [exerciseFeedback, setExerciseFeedback] = useState({});

  useEffect(() => {
    const fetchLessonDetails = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/lessons/${id}`);
        const lessonData = res.data.data;
        setLesson(lessonData);

        // Find translation for user's preferred language
        let translation = lessonData.translations?.find(
          (t) => t.language.toLowerCase() === user.preferredLanguage.toLowerCase()
        );

        if (!translation) {
          // Fall back to English
          translation = lessonData.translations?.find(
            (t) => t.language === 'English'
          );
          if (translation) {
            setIsFallback(true);
          }
        }

        // If no translation at all, mock a basic one from base metadata
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
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchLessonDetails();
    }
  }, [id, api, user]);

  const handleOptionChange = (idx, val) => {
    setExerciseAnswers({ ...exerciseAnswers, [idx]: val });
    // Reset feedback on selection change
    setExerciseFeedback({
      ...exerciseFeedback,
      [idx]: { checked: false, correct: false },
    });
  };

  const handleCheckAnswer = (idx, correctAnswer) => {
    const selected = exerciseAnswers[idx];
    if (!selected) {
      alert('Please select an option or type an answer first.');
      return;
    }

    const isCorrect = selected.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    setExerciseFeedback({
      ...exerciseFeedback,
      [idx]: { checked: true, correct: isCorrect },
    });
  };

  // Helper to parse simple markdown to HTML strings
  const renderMarkdown = (text) => {
    if (!text) return '';
    
    return text.split('\n').map((line, idx) => {
      let trimmed = line.trim();
      
      if (trimmed.startsWith('# ')) {
        return (
          <Typography key={idx} variant="h4" sx={{ fontWeight: 900, mt: 3, mb: 2, color: 'primary.main' }}>
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
            <Typography variant="body1">{trimmed.replace('* ', '')}</Typography>
          </Box>
        );
      }
      if (trimmed === '---') {
        return <Divider key={idx} sx={{ my: 4 }} />;
      }
      
      // Basic bold extraction
      if (trimmed.includes('**')) {
        const parts = trimmed.split('**');
        return (
          <Typography key={idx} variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
            {parts.map((part, pIdx) => (pIdx % 2 === 1 ? <strong key={pIdx}>{part}</strong> : part))}
          </Typography>
        );
      }

      if (trimmed === '') return <Box key={idx} sx={{ height: 16 }} />;

      return (
        <Typography key={idx} variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
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
      <Button
        variant="outlined"
        color="primary"
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 4 }}
      >
        Go Back
      </Button>

      {isFallback && (
        <Alert severity="info" sx={{ mb: 4, borderRadius: 3 }}>
          Materials are not available in <strong>{user.preferredLanguage}</strong>. Showing default English version below.
        </Alert>
      )}

      {/* Main lesson reader container */}
      <Paper sx={{ p: { xs: 3, sm: 5 }, border: '2px solid #e5e5e5', borderRadius: 5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 900, mb: 1, letterSpacing: '-1px' }}>
              {activeTranslation.title}
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
              {activeTranslation.description}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip label={user.preferredLanguage} color="primary" sx={{ fontWeight: 700 }} />
            <Chip label={`${lesson.estimatedDuration} min read`} variant="outlined" sx={{ fontWeight: 700 }} />
          </Box>
        </Box>
        <Divider sx={{ mb: 4 }} />

        {/* Content text */}
        <Box sx={{ mb: 5 }}>
          {renderMarkdown(activeTranslation.learningMaterials)}
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
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                      Exercise {idx + 1}: {ex.question}
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
                                    px: 2,
                                    py: 1,
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
                      // Text input fallback if no MCQ options
                      <TextField
                        fullWidth
                        label="Type your answer here"
                        value={selected}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                      />
                    )}

                    {/* Feedback result */}
                    {feedback.checked && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 3, p: 2, borderRadius: 3, bgcolor: feedback.correct ? 'rgba(88,204,2,0.1)' : 'rgba(255,82,82,0.1)', color: feedback.correct ? 'secondary.dark' : 'error.main' }}>
                        {feedback.correct ? (
                          <>
                            <CheckCircleIcon />
                            <Typography variant="body1" sx={{ fontWeight: 700 }}>Excellent! That's correct!</Typography>
                          </>
                        ) : (
                          <>
                            <CancelIcon />
                            <Typography variant="body1" sx={{ fontWeight: 700 }}>Not quite! The correct answer is: {ex.correctAnswer}</Typography>
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
                        Check Answer
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
