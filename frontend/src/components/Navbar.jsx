import React, { useContext, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Box,
  Avatar,
  Chip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import SchoolIcon from '@mui/icons-material/School';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import LanguageSelector from './LanguageSelector';

const Navbar = ({ onDrawerToggle }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    handleMenuClose();
    navigate('/profile');
  };

  const handleLogoutClick = () => {
    handleMenuClose();
    logout();
    navigate('/login');
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <SchoolIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              fontWeight: 800,
              letterSpacing: '-0.5px',
              cursor: 'pointer',
            }}
            onClick={() => navigate('/dashboard')}
          >
            NeoLiteracy
          </Typography>
          {user && (
            <Chip
              label={user.role === 'admin' ? 'Instructor / Admin' : 'Learner'}
              color={user.role === 'admin' ? 'warning' : 'secondary'}
              size="small"
              sx={{ ml: 2, fontWeight: 700, borderRadius: 2 }}
            />
          )}
        </Box>

        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {/* Show Language selector for learners */}
            {user.role === 'learner' && <LanguageSelector />}

            <IconButton
              onClick={handleMenuOpen}
              size="small"
              sx={{ ml: 2 }}
              aria-controls={Boolean(anchorEl) ? 'account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={Boolean(anchorEl) ? 'true' : undefined}
            >
              <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                {user.name.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              id="account-menu"
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              onClick={handleMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                elevation: 0,
                sx: {
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
                  mt: 1.5,
                  borderRadius: 3,
                  border: '2px solid #e5e5e5',
                  '& .MuiAvatar-root': {
                    width: 32,
                    height: 32,
                    ml: -0.5,
                    mr: 1,
                  },
                },
              }}
            >
              <MenuItem onClick={handleProfileClick} sx={{ fontWeight: 600 }}>
                <AccountCircleIcon sx={{ mr: 1, color: 'text.secondary' }} />
                My Profile
              </MenuItem>
              <MenuItem onClick={handleLogoutClick} sx={{ fontWeight: 600, color: 'error.main' }}>
                <LogoutIcon sx={{ mr: 1, color: 'error.main' }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
