import { createWebOrder } from '../models/web-order.js';

export class WebOrderService {
  static async createOrder(orderData) {
    // Validar datos básicos
    if (!orderData.items || !orderData.shipping_address || !orderData.payment_method || !orderData.total) {
      throw new Error('Missing required order data');
    }

    // Generar un número de pedido único (ejemplo simple)
    const datePart = new Date().toISOString().split('T')[0].replace(/-/g, ''); // e.g., 20250703
    const randomPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0'); // e.g., 001 to 999
    const orderNumber = `DOMI-${datePart}-${randomPart}`;


    const order = await createWebOrder({
      ...orderData,
      order_number: orderNumber
    });

    return order;
  }
}