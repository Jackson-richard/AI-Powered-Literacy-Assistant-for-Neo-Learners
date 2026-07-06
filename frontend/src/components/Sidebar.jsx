import React, { useContext } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Box,
  Typography,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import QuizIcon from '@mui/icons-material/Quiz';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import PersonIcon from '@mui/icons-material/Person';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const drawerWidth = 260;

const Sidebar = ({ mobileOpen, handleDrawerToggle }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const adminMenu = [
    { text: 'Dashboard Overview', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Manage Curriculum', icon: <MenuBookIcon />, path: '/curriculum' },
    { text: 'Manage Lessons', icon: <AutoStoriesIcon />, path: '/lessons' },
    { text: 'Manage Assessments', icon: <QuizIcon />, path: '/assessment' },
    { text: 'Learner Scores & Logs', icon: <AssignmentTurnedInIcon />, path: '/results' },
    { text: 'My Profile', icon: <PersonIcon />, path: '/profile' },
  ];

  const learnerMenu = [
    { text: 'Learner Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Study Path', icon: <MenuBookIcon />, path: '/curriculum' },
    { text: 'Assessments', icon: <QuizIcon />, path: '/assessment' },
    { text: 'My Results', icon: <AssignmentTurnedInIcon />, path: '/results' },
    { text: 'My Profile', icon: <PersonIcon />, path: '/profile' },
  ];

  const menuItems = user.role === 'admin' ? adminMenu : learnerMenu;

  const drawerContent = (
    <Box>
      <Toolbar />
      <Box sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 800, mb: 1, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          Menu
        </Typography>
      </Box>
      <List sx={{ px: 2 }}>
        {menuItems.map((item) => {
          const isSelected = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  if (mobileOpen) handleDrawerToggle();
                }}
                sx={{
                  borderRadius: 3,
                  py: 1.2,
                  px: 2,
                  backgroundColor: isSelected ? 'primary.main' : 'transparent',
                  color: isSelected ? 'primary.contrastText' : 'text.primary',
                  '&:hover': {
                    backgroundColor: isSelected ? 'primary.dark' : 'rgba(0,0,0,0.04)',
                  },
                  transition: 'all 0.1s ease',
                  borderBottom: isSelected ? '3px solid rgba(0,0,0,0.2)' : 'none',
                }}
              >
                <ListItemIcon sx={{ color: isSelected ? 'primary.contrastText' : 'primary.main', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: isSelected ? 700 : 600,
                    fontSize: '0.95rem',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      aria-label="mailbox folders"
    >
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            borderRight: '2px solid #e5e5e5',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            borderRight: '2px solid #e5e5e5',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
export { drawerWidth };
