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

// Obtener todos los productos (con soporte para paginación y filtrado)
router.get('/products', async (req, res) => {
  try {
    const { category, limit = 1000, offset = 0 } = req.query; // Aumenté el límite por defecto para simular "todos"
    let query = 'SELECT * FROM products';
    let params = [];

    if (category) {
      query += ' WHERE category = $1';
      params.push(category);
    }

    // Agregar LIMIT y OFFSET solo si se especifican valores válidos
    if (limit !== '1000' || offset !== '0') { // Evitar paginación si no se especifica
      query += ' LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
      params.push(Number(limit), Number(offset));
    }

    const result = await pool.query(query, params);
    const totalResult = await pool.query(
      'SELECT COUNT(*) FROM products' + (category ? ' WHERE category = $1' : ''),
      category ? [category] : []
    );
    const total = parseInt(totalResult.rows[0].count);

    const transformed = result.rows.map(transformProduct);

    // Si no se especifica paginación, devolver solo el array para compatibilidad
    if (!req.query.limit && !req.query.offset && !req.query.category) {
      return res.status(200).json(transformed); // Compatible con la versión anterior
    }

    // Devolver formato paginado
    res.status(200).json({
      products: transformed,
      total,
      page: Math.floor(Number(offset) / Number(limit)) + 1,
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    console.error('Error en /products:', error); // Log para depuración
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