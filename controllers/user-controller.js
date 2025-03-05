import { UserService } from '../services/user-service.js';

export class UserController {
  static async register(req, res) {
    try {
      const { first_name, last_name, email, password } = req.body;
      if (!first_name || !last_name || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
      }
      const user = await UserService.register(req.body);
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async login(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        const result = await UserService.login(req.body); // Obtiene el objeto completo { token, user }
        res.json(result); // Devuelve el objeto completo
    } catch (error) {
        res.status(401).json({ message: error.message });
    }
}
}
