// models/user.js
import pool from '../config/db.js';

export const createUser = async (userData) => {
  const { first_name, last_name, email, password } = userData;
  const query = `
    INSERT INTO users (first_name, last_name, email, password)
    VALUES ($1, $2, $3, $4)
    RETURNING id, first_name, last_name, email, created_at;
  `;
  const values = [first_name, last_name, email, password];
  const result = await pool.query(query, values);
  return result.rows[0];
};

export const findUserByEmail = async (email) => {
  const query = 'SELECT * FROM users WHERE email = $1';
  const result = await pool.query(query, [email]);
  return result.rows[0];
};