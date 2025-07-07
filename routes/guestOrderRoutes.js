import express from 'express';
import { WebOrderService } from '../services/web-order-service.js';

const router = express.Router();

router.post('/guest-orders', async (req, res) => {
  try {
    const orderData = {
      user_id: null, // Sin user_id para invitados
      items: req.body.cart,
      shipping_address: req.body.shippingAddress,
      billing_address: req.body.billingAddress,
      payment_method: req.body.paymentMethod,
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