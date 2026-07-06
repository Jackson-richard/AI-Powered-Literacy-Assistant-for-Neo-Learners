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
  Checkbox,
  ListItemText,
  OutlinedInput,
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
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { AuthContext } from '../context/AuthContext';
import { useAxios } from '../hooks/useAxios';
import { useNavigate } from 'react-router-dom';

const CurriculumPage = () => {
  const { user } = useContext(AuthContext);
  const api = useAxios();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [curricula, setCurricula] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [selectedCurriculum, setSelectedCurriculum] = useState(null); // For learner detail drill-down

  // Admin modal state
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'Beginner',
    order: 0,
    status: 'draft',
    lessons: [],
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const currRes = await api.get('/curriculum');
      setCurricula(currRes.data.data || []);
      
      if (user.role === 'admin') {
        const lessonRes = await api.get('/lessons');
        setLessons(lessonRes.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching curricula:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [api, user.role]);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({
      title: '',
      description: '',
      difficulty: 'Beginner',
      order: curricula.length,
      status: 'draft',
      lessons: [],
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (curr) => {
    setIsEditing(true);
    setEditId(curr._id);
    setFormData({
      title: curr.title,
      description: curr.description,
      difficulty: curr.difficulty,
      order: curr.order,
      status: curr.status,
      lessons: curr.lessons ? curr.lessons.map(l => l._id || l) : [],
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this curriculum?')) {
      try {
        await api.delete(`/curriculum/${id}`);
        loadData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      if (isEditing) {
        await api.put(`/curriculum/${editId}`, formData);
      } else {
        await api.post('/curriculum', formData);
      }
      setOpenDialog(false);
      loadData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.response?.data?.error || 'Validation error saving curriculum');
    }
  };

  const handleLessonsSelectChange = (event) => {
    const {
      target: { value },
    } = event;
    setFormData({
      ...formData,
      lessons: typeof value === 'string' ? value.split(',') : value,
    });
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
              Manage Curricula
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Create, update, delete study pathways and link lessons to them.
            </Typography>
          </Box>
          <Button variant="contained" color="secondary" startIcon={<AddIcon />} onClick={handleOpenAdd} sx={{ py: 1.2, px: 3 }}>
            Add Curriculum
          </Button>
        </Box>

        <TableContainer component={Paper} sx={{ border: '2px solid #e5e5e5', borderRadius: 4 }}>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.100' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Order</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Difficulty</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Lessons</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {curricula.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    No curricula found. Click "Add Curriculum" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                curricula.map((curr) => (
                  <TableRow key={curr._id} hover>
                    <TableCell sx={{ fontWeight: 700 }}>{curr.order}</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>{curr.title}</TableCell>
                    <TableCell>
                      <Chip label={curr.difficulty} color={getDifficultyColor(curr.difficulty)} size="small" sx={{ fontWeight: 700 }} />
                    </TableCell>
                    <TableCell>{curr.lessons?.length || 0} Lessons</TableCell>
                    <TableCell>
                      <Chip label={curr.status} color={curr.status === 'published' ? 'secondary' : 'default'} size="small" sx={{ fontWeight: 700 }} />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton color="primary" onClick={() => handleOpenEdit(curr)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDelete(curr._id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Create/Edit Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <Box component="form" onSubmit={handleFormSubmit}>
            <DialogTitle sx={{ fontWeight: 800 }}>{isEditing ? 'Edit Curriculum' : 'Create Curriculum'}</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
              {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
              <TextField
                required
                fullWidth
                label="Curriculum Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
              <TextField
                required
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Difficulty</InputLabel>
                    <Select
                      value={formData.difficulty}
                      label="Difficulty"
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
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
                    label="Order Index"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value, 10) })}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                  />
                </Grid>
              </Grid>
              
              <FormControl fullWidth sx={{ borderRadius: 3 }}>
                <InputLabel id="status-select-label">Status</InputLabel>
                <Select
                  labelId="status-select-label"
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  sx={{ borderRadius: 3 }}
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="published">Published</MenuItem>
                </Select>
              </FormControl>

              {/* Select Lessons checklist */}
              <FormControl fullWidth>
                <InputLabel id="lessons-checkbox-label">Associated Lessons</InputLabel>
                <Select
                  labelId="lessons-checkbox-label"
                  multiple
                  value={formData.lessons}
                  onChange={handleLessonsSelectChange}
                  input={<OutlinedInput label="Associated Lessons" />}
                  renderValue={(selected) => {
                    const selectedTitles = selected.map(id => lessons.find(l => l._id === id)?.title || id);
                    return selectedTitles.join(', ');
                  }}
                  sx={{ borderRadius: 3 }}
                >
                  {lessons.map((lesson) => (
                    <MenuItem key={lesson._id} value={lesson._id}>
                      <Checkbox checked={formData.lessons.indexOf(lesson._id) > -1} />
                      <ListItemText primary={lesson.title} secondary={`${lesson.category} (${lesson.difficulty})`} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
              <Button type="submit" variant="contained" color="primary">Save</Button>
            </DialogActions>
          </Box>
        </Dialog>
      </Box>
    );
  }

  // ==================== LEARNER LAYOUT ====================
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
          Your Study Pathways
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Select a curriculum path below to view lessons and start building your literacy skills.
        </Typography>
      </Box>

      {selectedCurriculum ? (
        // Detailed Curriculum Path Drilldown
        <Box>
          <Button variant="outlined" color="primary" onClick={() => setSelectedCurriculum(null)} sx={{ mb: 4 }}>
            ← Back to All Pathways
          </Button>

          <Card sx={{ mb: 4, border: '2px solid', borderColor: 'primary.main', position: 'relative', overflow: 'hidden' }}>
            <Box sx={{ position: 'absolute', top: 0, right: 0, p: 2 }}>
              <Chip label={selectedCurriculum.difficulty} color={getDifficultyColor(selectedCurriculum.difficulty)} sx={{ fontWeight: 700 }} />
            </Box>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 900, mb: 2 }}>
                {selectedCurriculum.title}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 1, maxWidth: '80%' }}>
                {selectedCurriculum.description}
              </Typography>
            </CardContent>
          </Card>

          <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>
            Course Roadmap: Lessons List
          </Typography>

          <Grid container spacing={3}>
            {(!selectedCurriculum.lessons || selectedCurriculum.lessons.length === 0) ? (
              <Grid item xs={12}>
                <Typography variant="body1" color="text.secondary">
                  No lessons have been added to this curriculum yet.
                </Typography>
              </Grid>
            ) : (
              selectedCurriculum.lessons.map((lesson, idx) => (
                <Grid item xs={12} key={lesson._id}>
                  <Card sx={{ '&:hover': { borderColor: 'secondary.main' }, transition: 'all 0.1s' }}>
                    <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Avatar sx={{ bgcolor: 'secondary.main', fontWeight: 800 }}>
                          {idx + 1}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 800 }}>
                            {lesson.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {lesson.description}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip label={lesson.category} size="small" sx={{ fontWeight: 600 }} />
                            <Chip label={`${lesson.estimatedDuration} mins`} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                            <Chip label={lesson.difficulty} size="small" color={getDifficultyColor(lesson.difficulty)} variant="outlined" sx={{ fontWeight: 600 }} />
                          </Box>
                        </Box>
                      </Box>
                      <Button variant="contained" color="secondary" endIcon={<ArrowForwardIcon />} onClick={() => navigate(`/lessons/${lesson._id}`)}>
                        Read Lesson
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        </Box>
      ) : (
        // Grid cards list of available curricula
        <Grid container spacing={3}>
          {curricula.length === 0 ? (
            <Grid item xs={12}>
              <Typography variant="body1" color="text.secondary">
                No pathways are published yet. Check back soon!
              </Typography>
            </Grid>
          ) : (
            curricula.map((curr) => (
              <Grid item xs={12} sm={6} key={curr._id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', '&:hover': { borderColor: 'primary.main' }, transition: 'all 0.1s' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Chip label={curr.difficulty} color={getDifficultyColor(curr.difficulty)} size="small" sx={{ fontWeight: 700 }} />
                      <Chip label={`${curr.lessons?.length || 0} Lessons`} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 900, mb: 1 }}>
                      {curr.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {curr.description}
                    </Typography>
                  </CardContent>
                  <Box sx={{ p: 3, pt: 0 }}>
                    <Divider sx={{ mb: 2 }} />
                    <Button variant="contained" color="primary" fullWidth endIcon={<PlayArrowIcon />} onClick={() => setSelectedCurriculum(curr)}>
                      Start Pathway
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}
    </Box>
  );
};

export default CurriculumPage;
