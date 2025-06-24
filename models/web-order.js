import pool from '../config/db.js';

export const createWebOrder = async (orderData) => {
  const {
    user_id,
    items,
    shipping_address,
    billing_address,
    payment_method,
    total,
    order_number,
    transaction_id
  } = orderData;

  const query = `
    INSERT INTO web_orders (user_id, items, shipping_address, billing_address, payment_method, total, order_number, transaction_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id, user_id, items, shipping_address, billing_address, payment_method, total, created_at, status, order_number, transaction_id;
  `;
  const values = [
    user_id,
    items,
    shipping_address,
    billing_address,
    payment_method,
    total,
    order_number,
    transaction_id
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};