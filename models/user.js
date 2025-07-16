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

export const findUserById = async (id) => {
  const query = `
    SELECT id, first_name, last_name, email, phone, city, state, address
    FROM users
    WHERE id = $1
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

export const updateUser = async (id, userData) => {
  const { first_name, last_name, phone, city, state, address } = userData;
  const query = `
    UPDATE users
    SET first_name = $1, last_name = $2, phone = $3, city = $4, state = $5, address = $6
    WHERE id = $7
    RETURNING id, first_name, last_name, email, phone, city, state, address;
  `;
  const values = [first_name, last_name, phone || null, city || null, state || null, address || null, id];
  const result = await pool.query(query, values);
  if (!result.rows[0]) {
    throw new Error('User not found');
  }
  return result.rows[0];
};