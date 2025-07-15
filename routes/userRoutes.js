import express from 'express';
import { UserController } from '../controllers/user-controller.js';
import authenticateToken from '../middleware/auth.js'; // Import the authentication middleware
import { UserService } from '../services/user-service.js';

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

//data user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await UserService.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.status(200).json({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      city: user.city,
      state: user.state,
      address: user.address,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;