import express from 'express';
import { WebOrderService } from '../services/web-order-service.js';

const router = express.Router();

router.post('/guest-orders', async (req, res) => {
  try {
    const orderData = {
      user_id: null,
      items: req.body.items,
      shipping_address: req.body.shipping_address, // Cambiar a shipping_address
      billing_address: req.body.billing_address,
      payment_method: req.body.payment_method,
      total: req.body.total,
      transaction_id: req.body.transactionId || `GUEST-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    const order = await WebOrderService.createOrder(orderData);
    res.status(201).json({ message: 'Guest order placed successfully', order });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;