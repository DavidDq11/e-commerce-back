// services/user-service.js
import { createUser, findUserByEmail } from '../models/user.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const saltRounds = 10;

export class UserService {
    static async register(userData) {
        console.log('Datos recibidos en UserService:', userData); // Para depurar
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
        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        return token;
    }
}