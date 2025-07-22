// services/user-service.js
import { createUser, findUserByEmail, findUserById, updateUser } from '../models/user.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const saltRounds = 10;

export class UserService {
  static async register(userData) {
    const { first_name, last_name, email, password } = userData;
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      throw new Error('Email already in use');
    }
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return await createUser({ first_name, last_name, email, password: hashedPassword });
  }

  static async login(userData) {
    const { email, password } = userData;
    const user = await findUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new Error('Invalid credentials');
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, admin: user.admin || false }, // Asegúrate de incluir admin, con valor por defecto false si es undefined
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        city: user.city,
        state: user.state,
        address: user.address,
        admin: user.admin || false // Incluir admin en la respuesta, con valor por defecto false
      }
    };
  }

  static async findUserById(id) {
    return await findUserById(id);
  }

  static async updateUser(id, userData) {
    const { first_name, last_name } = userData;
    if (!first_name || !last_name) {
      throw new Error('First name and last name are required');
    }
    return await updateUser(id, userData);
  }
}