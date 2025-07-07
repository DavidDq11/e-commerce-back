import express from 'express';
import { WebOrderService } from '../services/web-order-service.js';
import authenticateToken from '../middleware/auth.js';
import pool from '../config/db.js';

const router = express.Router();

router.post('/orders', authenticateToken, async (req, res) => {
  try {
    const orderData = {
      user_id: req.user.id,
      items: req.body.cart,
      shipping_address: req.body.shippingAddress,
      billing_address: req.body.billingAddress,
      payment_method: req.body.paymentMethod,
      total: req.body.total,
    };
    const order = await WebOrderService.createOrder(orderData);
    res.status(201).json({ message: 'Order placed successfully', order });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/orders/:order_number', async (req, res) => {
  try {
    const { order_number } = req.params;
    const query = `
      SELECT id, user_id, items, shipping_address, billing_address, payment_method, total, created_at, status, order_number, transaction_id
      FROM web_orders
      WHERE order_number = $1
    `;
    const result = await pool.query(query, [order_number]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;