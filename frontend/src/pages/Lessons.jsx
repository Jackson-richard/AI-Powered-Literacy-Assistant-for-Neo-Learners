import React, { useContext, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import TranslateIcon from '@mui/icons-material/Translate';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { AuthContext } from '../context/AuthContext';
import { useAxios } from '../hooks/useAxios';
import { useNavigate } from 'react-router-dom';

const LessonsPage = () => {
  const { user } = useContext(AuthContext);
  const api = useAxios();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState([]);
  
  // Base lesson dialog state
  const [openLessonDialog, setOpenLessonDialog] = useState(false);
  const [isEditingLesson, setIsEditingLesson] = useState(false);
  const [editLessonId, setEditLessonId] = useState(null);
  const [lessonError, setLessonError] = useState('');
  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    difficulty: 'Beginner',
    estimatedDuration: 15,
    category: '',
    status: 'draft',
  });

  // Translation dialog state
  const [openTransDialog, setOpenTransDialog] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [transError, setTransError] = useState('');
  const [transForm, setTransForm] = useState({
    language: 'English',
    title: '',
    description: '',
    learningMaterials: '',
    exercises: [], // Array of { question, options, correctAnswer }
  });

  // Exercise adding state inside Translation
  const [newExercise, setNewExercise] = useState({
    question: '',
    optionString: '', // comma separated options
    correctAnswer: '',
  });

  const loadLessons = async () => {
    try {
      setLoading(true);
      const res = await api.get('/lessons');
      setLessons(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLessons();
  }, [api]);

  const handleOpenAddLesson = () => {
    setIsEditingLesson(false);
    setLessonForm({
      title: '',
      description: '',
      difficulty: 'Beginner',
      estimatedDuration: 15,
      category: '',
      status: 'draft',
    });
    setLessonError('');
    setOpenLessonDialog(true);
  };

  const handleOpenEditLesson = (lesson) => {
    setIsEditingLesson(true);
    setEditLessonId(lesson._id);
    setLessonForm({
      title: lesson.title,
      description: lesson.description,
      difficulty: lesson.difficulty,
      estimatedDuration: lesson.estimatedDuration,
      category: lesson.category,
      status: lesson.status,
    });
    setLessonError('');
    setOpenLessonDialog(true);
  };

  const handleDeleteLesson = async (id) => {
    if (window.confirm('Deleting this lesson will cascade-delete all language translations. Proceed?')) {
      try {
        await api.delete(`/lessons/${id}`);
        loadLessons();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleLessonSubmit = async (e) => {
    e.preventDefault();
    setLessonError('');
    try {
      if (isEditingLesson) {
        await api.put(`/lessons/${editLessonId}`, lessonForm);
      } else {
        await api.post('/lessons', lessonForm);
      }
      setOpenLessonDialog(false);
      loadLessons();
    } catch (err) {
      setLessonError(err.response?.data?.message || err.response?.data?.error || 'Validation error');
    }
  };

  const handleOpenTranslations = (lesson) => {
    setSelectedLesson(lesson);
    setTransForm({
      language: 'English',
      title: '',
      description: '',
      learningMaterials: '',
      exercises: [],
    });
    setNewExercise({ question: '', optionString: '', correctAnswer: '' });
    setTransError('');
    setOpenTransDialog(true);
  };

  const handleLanguageChange = async (lang) => {
    setTransForm(prev => ({ ...prev, language: lang }));
    // Try to load existing translation from the lesson object
    const existing = selectedLesson.translations?.find(t => t.language === lang);
    if (existing) {
      setTransForm({
        language: lang,
        title: existing.title,
        description: existing.description,
        learningMaterials: existing.learningMaterials,
        exercises: existing.exercises || [],
      });
    } else {
      setTransForm({
        language: lang,
        title: '',
        description: '',
        learningMaterials: '',
        exercises: [],
      });
    }
  };

  // Add exercise to translation list locally
  const handleAddExerciseLocal = () => {
    if (!newExercise.question || !newExercise.correctAnswer) {
      alert('Exercise question and correct answer are required.');
      return;
    }
    const options = newExercise.optionString
      ? newExercise.optionString.split(',').map(o => o.trim())
      : [];

    setTransForm(prev => ({
      ...prev,
      exercises: [...prev.exercises, {
        question: newExercise.question,
        options,
        correctAnswer: newExercise.correctAnswer
      }]
    }));

    setNewExercise({ question: '', optionString: '', correctAnswer: '' });
  };

  const handleRemoveExerciseLocal = (index) => {
    setTransForm(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }));
  };

  const handleTranslationSubmit = async (e) => {
    e.preventDefault();
    setTransError('');
    try {
      await api.post(`/lessons/${selectedLesson._id}/translations`, transForm);
      setOpenTransDialog(false);
      loadLessons();
    } catch (err) {
      setTransError(err.response?.data?.message || err.response?.data?.error || 'Failed saving translation');
    }
  };

  const getDifficultyColor = (diff) => {
    switch (diff) {
      case 'Advanced': return 'error';
      case 'Intermediate': return 'primary';
      case 'Beginner':
      default: return 'success';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  // ==================== ADMIN LAYOUT ====================
  if (user.role === 'admin') {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
              Manage Lessons
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Create modular lessons and edit multi-lingual translations (English, Hindi, Tamil, Kannada).
            </Typography>
          </Box>
          <Button variant="contained" color="secondary" startIcon={<AddIcon />} onClick={handleOpenAddLesson} sx={{ py: 1.2, px: 3 }}>
            Add Lesson
          </Button>
        </Box>

        <TableContainer component={Paper} sx={{ border: '2px solid #e5e5e5', borderRadius: 4 }}>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.100' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Title (Base)</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Difficulty</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Duration</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Translations</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lessons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    No lessons found. Create a base lesson metadata record first.
                  </TableCell>
                </TableRow>
              ) : (
                lessons.map((lesson) => (
                  <TableRow key={lesson._id} hover>
                    <TableCell sx={{ fontWeight: 800 }}>{lesson.title}</TableCell>
                    <TableCell>{lesson.category}</TableCell>
                    <TableCell>
                      <Chip label={lesson.difficulty} color={getDifficultyColor(lesson.difficulty)} size="small" sx={{ fontWeight: 700 }} />
                    </TableCell>
                    <TableCell>{lesson.estimatedDuration} mins</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {['English', 'Hindi', 'Tamil', 'Kannada'].map((lang) => {
                          const hasTrans = lesson.translations?.some(t => t.language === lang);
                          return (
                            <Chip
                              key={lang}
                              label={lang.substring(0, 2).toUpperCase()}
                              color={hasTrans ? 'primary' : 'default'}
                              size="small"
                              variant={hasTrans ? 'filled' : 'outlined'}
                              sx={{ fontWeight: 700, fontSize: '0.65rem' }}
                            />
                          );
                        })}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={lesson.status} color={lesson.status === 'published' ? 'secondary' : 'default'} size="small" sx={{ fontWeight: 700 }} />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton color="secondary" onClick={() => handleOpenTranslations(lesson)} title="Manage translations">
                        <TranslateIcon />
                      </IconButton>
                      <IconButton color="primary" onClick={() => handleOpenEditLesson(lesson)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDeleteLesson(lesson._id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Base Lesson metadata Create/Edit dialog */}
        <Dialog open={openLessonDialog} onClose={() => setOpenLessonDialog(false)} maxWidth="sm" fullWidth>
          <Box component="form" onSubmit={handleLessonSubmit}>
            <DialogTitle sx={{ fontWeight: 800 }}>{isEditingLesson ? 'Edit Lesson Metadata' : 'Create Lesson Metadata'}</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
              {lessonError && <Alert severity="error">{lessonError}</Alert>}
              <TextField
                required
                fullWidth
                label="Base Title"
                value={lessonForm.title}
                onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
              <TextField
                required
                fullWidth
                multiline
                rows={2}
                label="Base Description"
                value={lessonForm.description}
                onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Difficulty</InputLabel>
                    <Select
                      value={lessonForm.difficulty}
                      label="Difficulty"
                      onChange={(e) => setLessonForm({ ...lessonForm, difficulty: e.target.value })}
                      sx={{ borderRadius: 3 }}
                    >
                      <MenuItem value="Beginner">Beginner</MenuItem>
                      <MenuItem value="Intermediate">Intermediate</MenuItem>
                      <MenuItem value="Advanced">Advanced</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    required
                    fullWidth
                    type="number"
                    label="Duration (minutes)"
                    value={lessonForm.estimatedDuration}
                    onChange={(e) => setLessonForm({ ...lessonForm, estimatedDuration: parseInt(e.target.value, 10) })}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                  />
                </Grid>
              </Grid>
              <TextField
                required
                fullWidth
                label="Category"
                placeholder="e.g. Alphabet, Words"
                value={lessonForm.category}
                onChange={(e) => setLessonForm({ ...lessonForm, category: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={lessonForm.status}
                  label="Status"
                  onChange={(e) => setLessonForm({ ...lessonForm, status: e.target.value })}
                  sx={{ borderRadius: 3 }}
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="published">Published</MenuItem>
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={() => setOpenLessonDialog(false)}>Cancel</Button>
              <Button type="submit" variant="contained" color="primary">Save</Button>
            </DialogActions>
          </Box>
        </Dialog>

        {/* Translation manager dialog */}
        <Dialog open={openTransDialog} onClose={() => setOpenTransDialog(false)} maxWidth="md" fullWidth>
          <Box component="form" onSubmit={handleTranslationSubmit}>
            <DialogTitle sx={{ fontWeight: 800 }}>
              Translate Lesson: {selectedLesson?.title}
            </DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
              {transError && <Alert severity="error">{transError}</Alert>}
              <FormControl fullWidth>
                <InputLabel>Target Language</InputLabel>
                <Select
                  value={transForm.language}
                  label="Target Language"
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  sx={{ borderRadius: 3 }}
                >
                  <MenuItem value="English">English</MenuItem>
                  <MenuItem value="Hindi">Hindi (हिंदी)</MenuItem>
                  <MenuItem value="Tamil">Tamil (தமிழ்)</MenuItem>
                  <MenuItem value="Kannada">Kannada (ಕನ್ನಡ)</MenuItem>
                </Select>
              </FormControl>

              <TextField
                required
                fullWidth
                label="Translated Title"
                value={transForm.title}
                onChange={(e) => setTransForm({ ...transForm, title: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
              <TextField
                required
                fullWidth
                label="Translated Description"
                value={transForm.description}
                onChange={(e) => setTransForm({ ...transForm, description: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
              <TextField
                required
                fullWidth
                multiline
                rows={6}
                label="Learning Materials (Markdown content)"
                placeholder="# Unit Topic\nWrite text materials here..."
                value={transForm.learningMaterials}
                onChange={(e) => setTransForm({ ...transForm, learningMaterials: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />

              <Divider />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Practice Exercises
              </Typography>

              {/* Added exercises list */}
              <List sx={{ border: '1px solid #e5e5e5', borderRadius: 3 }}>
                {transForm.exercises.length === 0 ? (
                  <ListItem>
                    <ListItemText secondary="No practice exercises added for this language translation." />
                  </ListItem>
                ) : (
                  transForm.exercises.map((ex, idx) => (
                    <ListItem
                      key={idx}
                      secondaryAction={
                        <IconButton edge="end" color="error" onClick={() => handleRemoveExerciseLocal(idx)}>
                          <DeleteIcon />
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primary={`Q${idx + 1}: ${ex.question}`}
                        secondary={`Options: ${ex.options?.join(', ') || 'Text Input'} | Correct: ${ex.correctAnswer}`}
                      />
                    </ListItem>
                  ))
                )}
              </List>

              {/* Add local exercise form */}
              <Box sx={{ border: '2px dashed #e5e5e5', p: 2, borderRadius: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                  Add New Practice Exercise
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Exercise Question text"
                      value={newExercise.question}
                      onChange={(e) => setNewExercise({ ...newExercise, question: e.target.value })}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Multiple Choice Options (comma separated)"
                      placeholder="Opt A, Opt B, Opt C"
                      value={newExercise.optionString}
                      onChange={(e) => setNewExercise({ ...newExercise, optionString: e.target.value })}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Correct Answer value"
                      value={newExercise.correctAnswer}
                      onChange={(e) => setNewExercise({ ...newExercise, correctAnswer: e.target.value })}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />
                  </Grid>
                </Grid>
                <Button
                  variant="outlined"
                  color="secondary"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddExerciseLocal}
                  sx={{ mt: 2 }}
                >
                  Add Exercise
                </Button>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={() => setOpenTransDialog(false)}>Close</Button>
              <Button type="submit" variant="contained" color="secondary">Save Translation</Button>
            </DialogActions>
          </Box>
        </Dialog>
      </Box>
    );
  }

  // ==================== LEARNER LAYOUT ====================
  // Categorize lessons dynamically
  const categories = [...new Set(lessons.map(l => l.category))];

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
          Lessons Library
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Explore single modular lessons to study language fundamentals.
        </Typography>
      </Box>

      {categories.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          No lessons are currently published.
        </Typography>
      ) : (
        categories.map((cat) => (
          <Box key={cat} sx={{ mb: 5 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, borderBottom: '3px solid #e5e5e5', pb: 1, textTransform: 'capitalize' }}>
              📁 Category: {cat}
            </Typography>
            <Grid container spacing={3}>
              {lessons
                .filter(l => l.category === cat)
                .map((lesson) => (
                  <Grid item xs={12} sm={6} md={4} key={lesson._id}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', '&:hover': { borderColor: 'secondary.main' }, transition: 'all 0.1s' }}>
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                          <Chip label={lesson.difficulty} color={getDifficultyColor(lesson.difficulty)} size="small" sx={{ fontWeight: 700 }} />
                          <Chip label={`${lesson.estimatedDuration}m`} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                          {lesson.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {lesson.description}
                        </Typography>
                      </CardContent>
                      <Box sx={{ p: 3, pt: 0 }}>
                        <Divider sx={{ mb: 2 }} />
                        <Button
                          fullWidth
                          variant="contained"
                          color="secondary"
                          endIcon={<ArrowForwardIcon />}
                          onClick={() => navigate(`/lessons/${lesson._id}`)}
                        >
                          Study Lesson
                        </Button>
                      </Box>
                    </Card>
                  </Grid>
                ))}
            </Grid>
          </Box>
        ))
      )}
    </Box>
  );
};

export default LessonsPage;
