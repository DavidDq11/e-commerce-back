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
    transaction_id,
  } = orderData;

  // Validar campos requeridos
  if (!items || !shipping_address || !payment_method || !total) {
    throw new Error('Missing required order data');
  }
  if (typeof items !== 'object' || items === null) {
    throw new Error('Invalid items format. Must be a valid JSON object or array.');
  }
  if (typeof shipping_address !== 'object' || shipping_address === null) {
    throw new Error('Invalid shipping_address format. Must be a valid JSON object.');
  }
  if (billing_address && typeof billing_address !== 'object') {
    throw new Error('Invalid billing_address format. Must be a valid JSON object.');
  }

  const serializedItems = JSON.stringify(items);
  const serializedShippingAddress = JSON.stringify(shipping_address);
  const serializedBillingAddress = billing_address ? JSON.stringify(billing_address) : null;

  const query = `
    INSERT INTO web_orders (user_id, items, shipping_address, billing_address, payment_method, total, order_number, transaction_id)
    VALUES ($1, $2::jsonb, $3::jsonb, $4::jsonb, $5, $6, $7, $8)
    RETURNING id, user_id, items, shipping_address, billing_address, payment_method, total, created_at, status, order_number, transaction_id;
  `;
  const values = [
    user_id || null,
    serializedItems,
    serializedShippingAddress,
    serializedBillingAddress,
    payment_method,
    total,
    order_number || `WEB-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    transaction_id,
  ];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Database error:', error.stack);
    throw error;
  }
};