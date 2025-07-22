import express from 'express';
import { WebOrderService } from '../services/web-order-service.js';
import authenticateToken from '../middleware/auth.js';
import pool from '../config/db.js';

const router = express.Router();

router.post('/orders', authenticateToken, async (req, res) => {
  try {
    const orderData = {
      user_id: req.user.id,
      items: req.body.items,
      shipping_address: req.body.shipping_address, // Cambiar a shipping_address
      billing_address: req.body.billing_address,
      payment_method: req.body.payment_method,
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

router.put('/orders/:order_number/status', authenticateToken, async (req, res) => {
  try {
    const { order_number } = req.params;
    const { status } = req.body;

    // Validar el estado recibido
    const validStatuses = ['pending', 'processing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be one of: ' + validStatuses.join(', ') });
    }

    // Verificar si el usuario es administrador
    const user = await pool.query('SELECT admin FROM users WHERE id = $1', [req.user.id]);
    if (!user.rows[0] || !user.rows[0].admin) {
      return res.status(403).json({ message: 'Only administrators can update order status' });
    }

    // Actualizar el estado de la orden
    const query = `
      UPDATE web_orders
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE order_number = $2
      RETURNING id, order_number, status, updated_at
    `;
    const result = await pool.query(query, [status, order_number]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.status(200).json({ message: 'Order status updated successfully', order: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Nueva ruta para obtener todas las órdenes (solo administradores)
router.get('/orders', authenticateToken, async (req, res) => {
  try {
    // Verificar si el usuario es administrador
    const user = await pool.query('SELECT admin FROM users WHERE id = $1', [req.user.id]);
    if (!user.rows[0] || !user.rows[0].admin) {
      return res.status(403).json({ message: 'Only administrators can view all orders' });
    }

    // Obtener todas las órdenes
    const query = `
      SELECT id, user_id, items, shipping_address, billing_address, payment_method, total, created_at, status, order_number, transaction_id
      FROM web_orders
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;