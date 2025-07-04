import express from 'express';
import { WebOrderService } from '../services/web-order-service.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

// Ruta protegida para crear un pedido
router.post('/orders', authenticateToken, async (req, res) => {
  // console.log('Received body:', req.body);
  try {
    const orderData = {
      user_id: req.user.id,
      items: req.body.cart,
      shipping_address: req.body.shippingAddress,
      billing_address: req.body.billingAddress,
      payment_method: req.body.paymentMethod,
      total: req.body.total
    };
    // console.log('Order Data:', orderData);
    const order = await WebOrderService.createOrder(orderData);
    res.status(201).json({ message: 'Order placed successfully', order });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;