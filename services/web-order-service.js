import pool from '../config/db.js';

export class WebOrderService {
  static async createOrder(orderData) {
    const client = await pool.connect();
    try {
      // Iniciar transacción
      await client.query('BEGIN');

      // Validar datos básicos
      const { user_id, items, shipping_address, payment_method, total } = orderData;
      if (!items || !Array.isArray(items) || items.length === 0) {
        throw new Error('Items must be a non-empty array');
      }
      if (!shipping_address || typeof shipping_address !== 'object') {
        throw new Error('Shipping address is required and must be an object');
      }
      if (!payment_method || typeof payment_method !== 'string') {
        throw new Error('Payment method is required and must be a string');
      }
      if (typeof total !== 'number' || total <= 0) {
        throw new Error('Total must be a positive number');
      }

      // Verificar stock disponible
      for (const item of items) {
        const { id, qty, size_id } = item;
        if (!id || !qty || qty <= 0 || !size_id) {
          throw new Error('Each item must have a valid product ID, quantity, and size ID');
        }

        const stockQuery = `
          SELECT stock_quantity
          FROM product_sizes
          WHERE product_id = $1 AND size_id = $2
          FOR UPDATE; -- Bloqueo para concurrencia
        `;
        const stockResult = await client.query(stockQuery, [id, size_id]);
        if (stockResult.rows.length === 0) {
          throw new Error(`Product with ID ${id} and size ${size_id} not found`);
        }
        const availableStock = stockResult.rows[0].stock_quantity;
        if (availableStock < qty) {
          throw new Error(`Insufficient stock for product ID ${id}, size ${size_id}. Available: ${availableStock}, Requested: ${qty}`);
        }
      }

      // Generar número de pedido único
      const datePart = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const randomPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const orderNumber = `DOMI-${datePart}-${randomPart}`;

      // Insertar pedido en web_orders
      const orderQuery = `
        INSERT INTO web_orders (user_id, items, shipping_address, billing_address, payment_method, total, order_number)
        VALUES ($1, $2::jsonb, $3::jsonb, $4::jsonb, $5, $6, $7)
        RETURNING id, order_number, created_at, status;
      `;
      const orderValues = [
        user_id || null,
        JSON.stringify(items),
        JSON.stringify(shipping_address),
        orderData.billing_address ? JSON.stringify(orderData.billing_address) : null,
        payment_method,
        total,
        orderNumber,
      ];
      const orderResult = await client.query(orderQuery, orderValues);
      const orderId = orderResult.rows[0].id;

      // Insertar ítems en order_items y actualizar stock
      for (const item of items) {
        const { id: product_id, qty, price, totalprice, size_id } = item;
        const itemQuery = `
          INSERT INTO order_items (order_id, product_id, size_id, quantity, price, total_price)
          VALUES ($1, $2, $3, $4, $5, $6);
        `;
        await client.query(itemQuery, [orderId, product_id, size_id, qty, price, totalprice]);

        // Actualizar stock
        const updateStockQuery = `
          UPDATE product_sizes
          SET stock_quantity = stock_quantity - $1
          WHERE product_id = $2 AND size_id = $3;
        `;
        await client.query(updateStockQuery, [qty, product_id, size_id]);
      }

      // Confirmar transacción
      await client.query('COMMIT');

      return {
        id: orderId,
        order_number: orderResult.rows[0].order_number,
        created_at: orderResult.rows[0].created_at,
        status: orderResult.rows[0].status,
        user_id,
        items,
        shipping_address,
        billing_address: orderData.billing_address || null,
        payment_method,
        total,
      };
    } catch (error) {
      // Revertir transacción en caso de error
      await client.query('ROLLBACK');
      throw new Error(`Order creation failed: ${error.message}`);
    } finally {
      client.release();
    }
  }
}