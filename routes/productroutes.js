import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// Función para transformar los datos de la base de datos
const transformProduct = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  category: row.category,
  type: row.type,
  sizes: row.sizes ? row.sizes : [],
  images: row.images ? row.images : [],
  price: row.price,
  prevprice: row.prevprice,
  stock: row.stock,
  rating: {
    rate: row.rating_rate,
    count: row.rating_count
  }
});

// Obtener todos los productos
router.get('/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products');
    const transformed = result.rows.map(transformProduct);
    res.status(200).json(transformed);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Obtener un producto por ID
router.get('/product/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    const product = result.rows[0];
    res.status(200).json(transformProduct(product));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router; 
