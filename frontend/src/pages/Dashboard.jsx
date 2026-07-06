import React, { useContext, useEffect, useState } from 'react';
import {
  Grid,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Divider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useAxios } from '../hooks/useAxios';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import QuizIcon from '@mui/icons-material/Quiz';
import AssignmentIcon from '@mui/icons-material/Assignment';
import StarIcon from '@mui/icons-material/Star';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const api = useAxios();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    curriculaCount: 0,
    lessonsCount: 0,
    assessmentsCount: 0,
    resultsCount: 0,
  });
  const [recentResults, setRecentResults] = useState([]);
  const [availableCurricula, setAvailableCurricula] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        // Load statistics
        const [currRes, lesRes, assessRes, resultsRes] = await Promise.all([
          api.get('/curriculum'),
          api.get('/lessons'),
          api.get('/assessments'),
          api.get('/results'),
        ]);

        setStats({
          curriculaCount: currRes.data.count || 0,
          lessonsCount: lesRes.data.count || 0,
          assessmentsCount: assessRes.data.count || 0,
          resultsCount: resultsRes.data.count || 0,
        });

        setRecentResults(resultsRes.data.data ? resultsRes.data.data.slice(0, 5) : []);
        setAvailableCurricula(currRes.data.data ? currRes.data.data.slice(0, 3) : []);
      } catch (err) {
        console.error('Error fetching dashboard info:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [api]);

  const getProficiencyColor = (lvl) => {
    switch (lvl) {
      case 'Advanced':
        return 'success';
      case 'Intermediate':
        return 'primary';
      case 'Beginner':
      default:
        return 'warning';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // --- ADMIN VIEW ---
  if (user.role === 'admin') {
    return (
      <Box>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
            Welcome, Instructor!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your teaching pathway, view metrics, and monitor student literacy progress.
          </Typography>
        </Box>

        {/* Admin stats */}
        <Grid container spacing={3} sx={{ mb: 5 }}>
          {[
            { label: 'Curricula', count: stats.curriculaCount, icon: <MenuBookIcon sx={{ fontSize: 40 }} />, color: 'primary.main', path: '/curriculum' },
            { label: 'Total Lessons', count: stats.lessonsCount, icon: <AutoStoriesIcon sx={{ fontSize: 40 }} />, color: 'secondary.main', path: '/lessons' },
            { label: 'Assessments', count: stats.assessmentsCount, icon: <QuizIcon sx={{ fontSize: 40 }} />, color: 'error.main', path: '/assessment' },
            { label: 'Submissions', count: stats.resultsCount, icon: <AssignmentIcon sx={{ fontSize: 40 }} />, color: 'warning.main', path: '/results' },
          ].map((item, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ cursor: 'pointer', '&:hover': { transform: 'scale(1.02)' }, transition: 'all 0.2s' }} onClick={() => navigate(item.path)}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 3 }}>
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5 }}>
                      {item.count}
                    </Typography>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700 }}>
                      {item.label}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: item.color, width: 60, height: 60 }}>
                    {item.icon}
                  </Avatar>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Quick action controls */}
        <Grid container spacing={3} sx={{ mb: 5 }}>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 1, height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                  Quick Admin Operations
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Button fullWidth variant="contained" color="primary" onClick={() => navigate('/curriculum')} sx={{ py: 1.5 }}>
                      Manage Path
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button fullWidth variant="contained" color="secondary" onClick={() => navigate('/lessons')} sx={{ py: 1.5 }}>
                      Add Lesson
                    </Button>
                  </Grid>
                  <Grid item xs={12}>
                    <Button fullWidth variant="outlined" color="error" onClick={() => navigate('/assessment')} sx={{ py: 1.5 }}>
                      Manage Quizzes & Questions
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                  Learner Enrollment Profile
                </Typography>
                <Divider sx={{ mb: 3 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Use this screen to monitor student records. Learners login details, preferred languages, and assessment history logs are available.
                  </Typography>
                  <Button variant="contained" color="secondary" onClick={() => navigate('/results')} sx={{ alignSelf: 'flex-start' }}>
                    View Student Logs
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Recent Results Table */}
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
          Recent Submissions Logs
        </Typography>
        <TableContainer component={Paper} sx={{ border: '2px solid #e5e5e5', borderRadius: 4 }}>
          <Table>
            <TableHead sx={{ bgcolor: 'grey.100' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Learner</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Quiz / Exam</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Overall Score</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Level</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Submitted Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentResults.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    No assessment attempts recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                recentResults.map((row) => (
                  <TableRow key={row._id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{row.userId?.name || 'N/A'}</TableCell>
                    <TableCell>{row.assessmentId?.title || 'General Quiz'}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{row.scores?.overall}%</TableCell>
                    <TableCell>
                      <Chip label={row.proficiency} color={getProficiencyColor(row.proficiency)} size="small" sx={{ fontWeight: 700 }} />
                    </TableCell>
                    <TableCell>{new Date(row.completedAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  }

  // --- LEARNER VIEW ---
  // Compute learner's average proficiency based on recentResults
  const learnerProficiency = recentResults.length > 0 ? recentResults[0].proficiency : 'Beginner';

  return (
    <Box>
      {/* Welcome banner */}
      <Box sx={{ mb: 4, bgcolor: 'primary.light', p: 4, borderRadius: 6, border: '2px solid', borderColor: 'primary.main', color: 'primary.contrastText', boxShadow: '0 4px 15px rgba(0,176,255,0.1)' }}>
        <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, letterSpacing: '-1px' }}>
          Hello, {user.name}! 👋
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 500 }}>
          Your preferred study language is set to <strong>{user.preferredLanguage}</strong>. Let's learn something new today!
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Proficiency Profile */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
            <CardContent>
              <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 800, mb: 2 }}>
                Current Level
              </Typography>
              <Avatar sx={{ bgcolor: getProficiencyColor(learnerProficiency) + '.main', width: 90, height: 90, mx: 'auto', mb: 2 }}>
                <EmojiEventsIcon sx={{ fontSize: 50, color: '#fff' }} />
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
                {learnerProficiency}
              </Typography>
              <Chip label="Neo-Learner Badge" color="secondary" sx={{ fontWeight: 700, mb: 3 }} />
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Take assessments after reading lesson materials to rank up from Beginner to Intermediate and Advanced.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Study pathway progress */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%', p: 1 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Recommended Pathways
                </Typography>
                <Button color="primary" onClick={() => navigate('/curriculum')} sx={{ fontWeight: 700 }}>
                  View All Paths
                </Button>
              </Box>
              <Divider sx={{ mb: 3 }} />

              {availableCurricula.length === 0 ? (
                <Typography variant="body1" align="center" sx={{ py: 4 }}>
                  No curricula paths available right now. Please wait for an instructor.
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {availableCurricula.map((curr) => (
                    <Box key={curr._id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2.5, borderRadius: 4, border: '2px solid #e5e5e5', '&:hover': { borderColor: 'primary.main' }, transition: 'all 0.1s' }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                          {curr.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {curr.description.length > 80 ? curr.description.substring(0, 80) + '...' : curr.description}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          <Chip label={curr.difficulty} size="small" sx={{ fontWeight: 600 }} />
                          <Chip label={`${curr.lessons?.length || 0} Lessons`} size="small" color="primary" variant="outlined" sx={{ fontWeight: 600 }} />
                        </Box>
                      </Box>
                      <Button variant="contained" color="secondary" onClick={() => navigate('/curriculum')}>
                        Start
                      </Button>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Performance results */}
        <Grid item xs={12}>
          <Card sx={{ p: 1 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Your Recent Quiz Scores
                </Typography>
                <Button color="primary" onClick={() => navigate('/results')} sx={{ fontWeight: 700 }}>
                  View Details
                </Button>
              </Box>
              <Divider sx={{ mb: 3 }} />

              {recentResults.length === 0 ? (
                <Typography variant="body1" align="center" sx={{ py: 4 }}>
                  You haven't completed any assessments yet. Jump to the Pathways page or click on Assessments!
                </Typography>
              ) : (
                <Grid container spacing={3}>
                  {recentResults.slice(0, 3).map((res) => (
                    <Grid item xs={12} sm={4} key={res._id}>
                      <Box sx={{ p: 3, borderRadius: 4, border: '2px solid #e5e5e5', textAlign: 'center' }}>
                        <Typography variant="h5" color="primary.main" sx={{ fontWeight: 900 }}>
                          {res.scores?.overall}%
                        </Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 1 }}>
                          {res.assessmentId?.title || 'General Quiz'}
                        </Typography>
                        <Chip label={res.proficiency} color={getProficiencyColor(res.proficiency)} size="small" sx={{ fontWeight: 700, mt: 1 }} />
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                          Taken on: {new Date(res.completedAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
