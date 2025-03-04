import express from 'express';
import { UserController } from '../controllers/user-controller.js';
import authenticateToken from '../middleware/auth.js'; // Import the authentication middleware

const router = express.Router();

// Register route
router.post('/register', UserController.register);

// Login route
router.post('/login', UserController.login);

// Logout route (optional, basic implementation)
router.post('/logout', (req, res) => {
  // Add logic to invalidate the token or clear the session if needed
  // For now, a simple response
  res.json({ message: 'Logout successful' });
});

// Protected route
router.post('/protected', authenticateToken, (req, res) => {
  res.json({ message: 'Protected route', user: req.user });
});

export default router;