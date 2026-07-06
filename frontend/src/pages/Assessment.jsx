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
  Radio,
  RadioGroup,
  FormControlLabel,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import ListIcon from '@mui/icons-material/List';
import StarIcon from '@mui/icons-material/Star';
import { AuthContext } from '../context/AuthContext';
import { useAxios } from '../hooks/useAxios';
import { useNavigate } from 'react-router-dom';

const AssessmentPage = () => {
  const { user } = useContext(AuthContext);
  const api = useAxios();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState([]);
  
  // Active Assessment taking state (Learner)
  const [activeAssessment, setActiveAssessment] = useState(null);
  const [answers, setAnswers] = useState({}); // key: questionId, value: selectedAnswer
  const [submittedResult, setSubmittedResult] = useState(null);

  // Admin assessment dialog state
  const [openAssessDialog, setOpenAssessDialog] = useState(false);
  const [isEditingAssess, setIsEditingAssess] = useState(false);
  const [editAssessId, setEditAssessId] = useState(null);
  const [assessError, setAssessError] = useState('');
  const [assessForm, setAssessForm] = useState({
    title: '',
    description: '',
    type: 'Comprehension',
    difficulty: 'Beginner',
    status: 'draft',
  });

  // Admin question manager dialog state
  const [openQuestionsDialog, setOpenQuestionsDialog] = useState(false);
  const [selectedAssess, setSelectedAssess] = useState(null);
  const [questionError, setQuestionError] = useState('');
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [questionForm, setQuestionForm] = useState({
    type: 'Reading',
    text: '',
    optionString: '',
    correctAnswer: '',
    difficulty: 'Beginner',
    points: 10,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/assessments');
      setAssessments(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [api]);

  const handleOpenAddAssess = () => {
    setIsEditingAssess(false);
    setAssessForm({
      title: '',
      description: '',
      type: 'Comprehension',
      difficulty: 'Beginner',
      status: 'draft',
    });
    setAssessError('');
    setOpenAssessDialog(true);
  };

  const handleOpenEditAssess = (assess) => {
    setIsEditingAssess(true);
    setEditAssessId(assess._id);
    setAssessForm({
      title: assess.title,
      description: assess.description,
      type: assess.type,
      difficulty: assess.difficulty,
      status: assess.status,
    });
    setAssessError('');
    setOpenAssessDialog(true);
  };

  const handleDeleteAssess = async (id) => {
    if (window.confirm('Deleting this assessment will delete all associated questions. Proceed?')) {
      try {
        await api.delete(`/assessments/${id}`);
        loadData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAssessSubmit = async (e) => {
    e.preventDefault();
    setAssessError('');
    try {
      if (isEditingAssess) {
        await api.put(`/assessments/${editAssessId}`, assessForm);
      } else {
        await api.post('/assessments', assessForm);
      }
      setOpenAssessDialog(false);
      loadData();
    } catch (err) {
      setAssessError(err.response?.data?.message || err.response?.data?.error || 'Validation error');
    }
  };

  const handleOpenQuestions = (assess) => {
    setSelectedAssess(assess);
    resetQuestionForm();
    setQuestionError('');
    setOpenQuestionsDialog(true);
  };

  const resetQuestionForm = () => {
    setEditingQuestionId(null);
    setQuestionForm({
      type: 'Reading',
      text: '',
      optionString: '',
      correctAnswer: '',
      difficulty: 'Beginner',
      points: 10,
    });
  };

  const handleSelectQuestionForEdit = (q) => {
    setEditingQuestionId(q._id);
    setQuestionForm({
      type: q.type,
      text: q.text,
      optionString: q.options ? q.options.join(', ') : '',
      correctAnswer: q.correctAnswer,
      difficulty: q.difficulty,
      points: q.points || 10,
    });
  };

  const handleQuestionSave = async (e) => {
    e.preventDefault();
    setQuestionError('');

    const options = questionForm.optionString
      ? questionForm.optionString.split(',').map(o => o.trim())
      : [];

    const payload = {
      type: questionForm.type,
      text: questionForm.text,
      options,
      correctAnswer: questionForm.correctAnswer,
      difficulty: questionForm.difficulty,
      points: parseInt(questionForm.points, 10),
    };

    try {
      if (editingQuestionId) {
        await api.put(`/assessments/questions/${editingQuestionId}`, payload);
      } else {
        await api.post(`/assessments/${selectedAssess._id}/questions`, payload);
      }
      
      // Reload Selected Assess Questions in dialog
      const freshAssess = await api.get(`/assessments/${selectedAssess._id}`);
      setSelectedAssess(freshAssess.data.data);
      resetQuestionForm();
    } catch (err) {
      setQuestionError(err.response?.data?.message || err.response?.data?.error || 'Question error');
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (window.confirm('Delete this question?')) {
      try {
        await api.delete(`/assessments/questions/${qId}`);
        const freshAssess = await api.get(`/assessments/${selectedAssess._id}`);
        setSelectedAssess(freshAssess.data.data);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Learner Take Quiz Handlers
  const handleStartQuiz = (assess) => {
    setActiveAssessment(assess);
    setAnswers({});
    setSubmittedResult(null);
  };

  const handleSelectOption = (questionId, value) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleQuizSubmit = async () => {
    const questionsList = activeAssessment.questions || [];
    // Ensure all questions answered
    const unanswered = questionsList.filter(q => !answers[q._id]);
    if (unanswered.length > 0) {
      if (!window.confirm(`You have not answered all questions. Submit anyway?`)) {
        return;
      }
    }

    try {
      setLoading(true);
      const submissions = questionsList.map(q => ({
        questionId: q._id,
        selectedAnswer: answers[q._id] || '',
      }));

      const res = await api.post('/responses', {
        assessmentId: activeAssessment._id,
        submissions,
      });

      if (res.data && res.data.success) {
        setSubmittedResult(res.data.data);
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting answers.');
    } finally {
      setLoading(false);
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

  if (loading && !activeAssessment) {
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
              Manage Assessments
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Create tests and add graded questions for Reading, Writing, and Comprehension skills.
            </Typography>
          </Box>
          <Button variant="contained" color="secondary" startIcon={<AddIcon />} onClick={handleOpenAddAssess} sx={{ py: 1.2, px: 3 }}>
            Add Assessment
          </Button>
        </Box>

        <TableContainer component={Paper} sx={{ border: '2px solid #e5e5e5', borderRadius: 4 }}>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.100' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Assessment Title</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Skill Category</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Difficulty</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Total Questions</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assessments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    No assessments found. Create one.
                  </TableCell>
                </TableRow>
              ) : (
                assessments.map((assess) => (
                  <TableRow key={assess._id} hover>
                    <TableCell sx={{ fontWeight: 800 }}>{assess.title}</TableCell>
                    <TableCell>{assess.type}</TableCell>
                    <TableCell>
                      <Chip label={assess.difficulty} color={getDifficultyColor(assess.difficulty)} size="small" sx={{ fontWeight: 700 }} />
                    </TableCell>
                    <TableCell>{assess.questions?.length || 0} Questions</TableCell>
                    <TableCell>
                      <Chip label={assess.status} color={assess.status === 'published' ? 'secondary' : 'default'} size="small" sx={{ fontWeight: 700 }} />
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" startIcon={<ListIcon />} variant="outlined" color="secondary" onClick={() => handleOpenQuestions(assess)} sx={{ mr: 1 }}>
                        Questions
                      </Button>
                      <IconButton color="primary" onClick={() => handleOpenEditAssess(assess)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDeleteAssess(assess._id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Assessment Edit dialog */}
        <Dialog open={openAssessDialog} onClose={() => setOpenAssessDialog(false)} maxWidth="sm" fullWidth>
          <Box component="form" onSubmit={handleAssessSubmit}>
            <DialogTitle sx={{ fontWeight: 800 }}>{isEditingAssess ? 'Edit Assessment' : 'Create Assessment'}</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
              {assessError && <Alert severity="error">{assessError}</Alert>}
              <TextField
                required
                fullWidth
                label="Assessment Title"
                value={assessForm.title}
                onChange={(e) => setAssessForm({ ...assessForm, title: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
              <TextField
                required
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={assessForm.description}
                onChange={(e) => setAssessForm({ ...assessForm, description: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={assessForm.type}
                      label="Type"
                      onChange={(e) => setAssessForm({ ...assessForm, type: e.target.value })}
                      sx={{ borderRadius: 3 }}
                    >
                      <MenuItem value="Reading">Reading</MenuItem>
                      <MenuItem value="Writing">Writing</MenuItem>
                      <MenuItem value="Comprehension">Comprehension</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Difficulty</InputLabel>
                    <Select
                      value={assessForm.difficulty}
                      label="Difficulty"
                      onChange={(e) => setAssessForm({ ...assessForm, difficulty: e.target.value })}
                      sx={{ borderRadius: 3 }}
                    >
                      <MenuItem value="Beginner">Beginner</MenuItem>
                      <MenuItem value="Intermediate">Intermediate</MenuItem>
                      <MenuItem value="Advanced">Advanced</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={assessForm.status}
                  label="Status"
                  onChange={(e) => setAssessForm({ ...assessForm, status: e.target.value })}
                  sx={{ borderRadius: 3 }}
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="published">Published</MenuItem>
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={() => setOpenAssessDialog(false)}>Cancel</Button>
              <Button type="submit" variant="contained" color="primary">Save</Button>
            </DialogActions>
          </Box>
        </Dialog>

        {/* Questions Manager Dialog */}
        <Dialog open={openQuestionsDialog} onClose={() => setOpenQuestionsDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ fontWeight: 800 }}>
            Questions in: {selectedAssess?.title}
          </DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Display existing questions */}
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Existing Questions ({selectedAssess?.questions?.length || 0})
            </Typography>
            <List sx={{ border: '1px solid #e5e5e5', borderRadius: 3, maxH: 250, overflowY: 'auto' }}>
              {(!selectedAssess?.questions || selectedAssess.questions.length === 0) ? (
                <Typography variant="body2" sx={{ p: 2 }} color="text.secondary">No questions added yet.</Typography>
              ) : (
                selectedAssess.questions.map((q, idx) => (
                  <Box key={q._id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderBottom: '1px solid #e5e5e5' }}>
                    <Box sx={{ maxWidth: '80%' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {idx + 1}. [{q.type}] {q.text}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Options: {q.options?.join(', ') || 'Text Input'} | Correct: {q.correctAnswer} | Pts: {q.points}
                      </Typography>
                    </Box>
                    <Box>
                      <IconButton size="small" color="primary" onClick={() => handleSelectQuestionForEdit(q)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDeleteQuestion(q._id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                ))
              )}
            </List>

            <Divider />
            
            {/* Create/Edit question form */}
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              {editingQuestionId ? 'Edit Selected Question' : 'Create New Question'}
            </Typography>
            <Box component="form" onSubmit={handleQuestionSave} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {questionError && <Alert severity="error">{questionError}</Alert>}
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={questionForm.type}
                      label="Type"
                      onChange={(e) => setQuestionForm({ ...questionForm, type: e.target.value })}
                    >
                      <MenuItem value="Reading">Reading</MenuItem>
                      <MenuItem value="Writing">Writing</MenuItem>
                      <MenuItem value="Comprehension">Comprehension</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Difficulty</InputLabel>
                    <Select
                      value={questionForm.difficulty}
                      label="Difficulty"
                      onChange={(e) => setQuestionForm({ ...questionForm, difficulty: e.target.value })}
                    >
                      <MenuItem value="Beginner">Beginner</MenuItem>
                      <MenuItem value="Intermediate">Intermediate</MenuItem>
                      <MenuItem value="Advanced">Advanced</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <TextField
                required
                fullWidth
                size="small"
                label="Question Text"
                value={questionForm.text}
                onChange={(e) => setQuestionForm({ ...questionForm, text: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
              <Grid container spacing={2}>
                <Grid item xs={8}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Options (comma separated, leave blank for free writing)"
                    placeholder="Option 1, Option 2, Option 3"
                    value={questionForm.optionString}
                    onChange={(e) => setQuestionForm({ ...questionForm, optionString: e.target.value })}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    required
                    fullWidth
                    size="small"
                    type="number"
                    label="Points"
                    value={questionForm.points}
                    onChange={(e) => setQuestionForm({ ...questionForm, points: parseInt(e.target.value, 10) })}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                  />
                </Grid>
              </Grid>
              
              <TextField
                required
                fullWidth
                size="small"
                label="Correct Answer value"
                value={questionForm.correctAnswer}
                onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button type="submit" variant="contained" color="secondary">
                  {editingQuestionId ? 'Update Question' : 'Save Question'}
                </Button>
                {editingQuestionId && (
                  <Button onClick={resetQuestionForm} variant="outlined">Cancel Edit</Button>
                )}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpenQuestionsDialog(false)}>Done</Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // ==================== LEARNER LAYOUT ====================
  // Check if actively taking quiz
  if (activeAssessment) {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (submittedResult) {
      // Show Scoreboard Summary Modal
      return (
        <Box sx={{ maxWidth: 600, mx: 'auto', textAlign: 'center', py: 4 }}>
          <Paper sx={{ p: 5, border: '3px solid', borderColor: 'secondary.main', borderRadius: 6 }}>
            <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, color: 'secondary.main' }}>
              Quiz Finished! 🎉
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
              Here is your graded literacy performance report:
            </Typography>

            <Box sx={{ my: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h2" sx={{ fontWeight: 950, color: 'primary.main' }}>
                {submittedResult.scores?.overall}%
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                Proficiency: <Chip label={submittedResult.proficiency} color={getDifficultyColor(submittedResult.proficiency)} sx={{ fontSize: '1rem', py: 2, px: 2, fontWeight: 700 }} />
              </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Score item breakdown */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
              {[
                { type: 'Reading', score: submittedResult.scores?.reading },
                { type: 'Writing', score: submittedResult.scores?.writing },
                { type: 'Comprehension', score: submittedResult.scores?.comprehension },
              ].map((b, idx) => (
                <Grid item xs={4} key={idx}>
                  <Box sx={{ p: 2, borderRadius: 3, border: '1px solid #e5e5e5' }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700 }}>
                      {b.type}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      {b.score}%
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>

            <Button variant="contained" color="primary" fullWidth onClick={() => {
              setActiveAssessment(null);
              setSubmittedResult(null);
              loadData();
            }} sx={{ py: 1.5 }}>
              Return to Assessments
            </Button>
          </Paper>
        </Box>
      );
    }

    const questionsList = activeAssessment.questions || [];

    return (
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Quiz: {activeAssessment.title}
          </Typography>
          <Button variant="outlined" color="error" onClick={() => setActiveAssessment(null)}>
            Quit Exam
          </Button>
        </Box>

        {questionsList.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1">This assessment has no questions. Please report to your instructor.</Typography>
          </Paper>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {questionsList.map((q, idx) => {
              const selected = answers[q._id] || '';
              return (
                <Card key={q._id} sx={{ border: '2px solid #e5e5e5', borderRadius: 4 }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Chip label={`Question ${idx + 1} of ${questionsList.length}`} size="small" sx={{ fontWeight: 700 }} />
                      <Chip label={`${q.type} Section`} size="small" color="primary" sx={{ fontWeight: 700 }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>
                      {q.text}
                    </Typography>

                    {q.options && q.options.length > 0 ? (
                      <FormControl component="fieldset" fullWidth>
                        <RadioGroup
                          value={selected}
                          onChange={(e) => handleSelectOption(q._id, e.target.value)}
                        >
                          <Grid container spacing={2}>
                            {q.options.map((opt, optIdx) => (
                              <Grid item xs={12} sm={6} key={optIdx}>
                                <Paper
                                  sx={{
                                    px: 2.5,
                                    py: 1.5,
                                    borderRadius: 3,
                                    border: '2px solid',
                                    borderColor: selected === opt ? 'secondary.main' : '#e5e5e5',
                                    bgcolor: selected === opt ? 'rgba(88,204,2,0.03)' : 'transparent',
                                    '&:hover': { borderColor: 'secondary.light' },
                                  }}
                                >
                                  <FormControlLabel
                                    value={opt}
                                    control={<Radio color="secondary" />}
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
                      // Text input for short answers
                      <TextField
                        fullWidth
                        label="Type your response value"
                        value={selected}
                        onChange={(e) => handleSelectOption(q._id, e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                      />
                    )}
                  </CardContent>
                </Card>
              );
            })}

            <Button
              variant="contained"
              color="secondary"
              fullWidth
              size="large"
              onClick={handleQuizSubmit}
              sx={{ py: 1.8, fontSize: '1.1rem' }}
            >
              Submit Assessment Answers
            </Button>
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
          Assessments
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Test your reading, writing, and comprehension levels with quizzes below.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {assessments.length === 0 ? (
          <Grid item xs={12}>
            <Typography variant="body1" color="text.secondary">
              No assessments are published yet. Check back soon!
            </Typography>
          </Grid>
        ) : (
          assessments.map((assess) => (
            <Grid item xs={12} sm={6} key={assess._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', '&:hover': { borderColor: 'primary.main' }, transition: 'all 0.1s' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Chip label={assess.difficulty} color={getDifficultyColor(assess.difficulty)} size="small" sx={{ fontWeight: 700 }} />
                    <Chip label={assess.type} color="primary" size="small" sx={{ fontWeight: 700 }} />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>
                    {assess.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {assess.description}
                  </Typography>
                </CardContent>
                <Box sx={{ p: 3, pt: 0 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Button
                    fullWidth
                    variant="contained"
                    color="secondary"
                    disabled={!assess.questions || assess.questions.length === 0}
                    onClick={() => handleStartQuiz(assess)}
                  >
                    Start Assessment ({assess.questions?.length || 0} Questions)
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );
};

export default AssessmentPage;
