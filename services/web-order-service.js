import { createWebOrder } from '../models/web-order.js';

export class WebOrderService {
  static async createOrder(orderData) {
    // Validar datos básicos
    if (!orderData.user_id || !orderData.items || !orderData.shipping_address || !orderData.payment_method || !orderData.total) {
      throw new Error('Missing required order data');
    }

    // Generar un número de pedido único (ejemplo simple)
    const orderNumber = `WEB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const order = await createWebOrder({
      ...orderData,
      order_number: orderNumber
    });

    return order;
  }
}