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
  animal_category: row.animal_category,
  brand: row.brand_name || null,
  sizes: row.sizes || [],
  images: row.images || [],
  price: row.min_price || null,
  prevprice: null,
  stock: row.total_stock || 0,
  rating: {
    rate: 0,
    count: 0
  }
});

// Mapeo de categorías de la URL a tipos en la base de datos
const typeMap = {
  'DryFood': 'Pet Food',
  'WetFood': 'Wet Food',
  'Snacks': 'Pet Treats',
  'Litter': 'Litter'
};

// Obtener todos los productos (con soporte para paginación y filtrado)
router.get('/products', async (req, res) => {
  try {
    const { category, limit = 25, offset = 0 } = req.query;
    let query = `
      SELECT 
        p.id,
        p.title,
        p.description,
        p.category,
        p.type,
        p.animal_category,
        b.name AS brand_name,
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'size_id', ps.size_id,
              'size', ps.size,
              'price', ps.price,
              'stock_quantity', ps.stock_quantity,
              'image_url', ps.image_url
            )
          ) 
          FROM product_sizes ps 
          WHERE ps.product_id = p.id
          ), '[]'::json
        ) AS sizes,
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'image_id', i.image_id,
              'image_url', i.image_url
            )
          ) 
          FROM images i 
          WHERE i.product_id = p.id
          ), '[]'::json
        ) AS images,
        MIN(ps.price) AS min_price,
        SUM(ps.stock_quantity) AS total_stock
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN product_sizes ps ON p.id = ps.product_id
    `;
    let params = [];
    let whereClauses = [];

    if (category) {
      const mappedCategory = typeMap[category] || category;
      whereClauses.push('p.category = $' + (params.length + 1));
      params.push(mappedCategory);
    }

    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }

    query += ' GROUP BY p.id, p.title, p.description, p.category, p.type, p.animal_category, b.name';
    query += ' LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(Number(limit), Number(offset));

    const result = await pool.query(query, params);
    const transformed = result.rows.map(row => transformProduct(row));

    // Calculate total independently
    let countQuery = 'SELECT COUNT(DISTINCT p.id) FROM products p';
    let countParams = [];
    if (whereClauses.length > 0) {
      countQuery += ' WHERE ' + whereClauses.join(' AND ');
      countParams = params.slice(0, params.length - 2);
    }
    const totalResult = await pool.query(countQuery, countParams);
    const total = parseInt(totalResult.rows[0].count);

    res.status(200).json({
      products: transformed,
      total,
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    console.error('Error en /products:', error.stack);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
});

// Obtener un producto por ID
router.get('/product/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    const query = `
      SELECT 
        p.id,
        p.title,
        p.description,
        p.category,
        p.type,
        p.animal_category,
        b.name AS brand_name,
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'size_id', ps.size_id,
              'size', ps.size,
              'price', ps.price,
              'stock_quantity', ps.stock_quantity,
              'image_url', ps.image_url
            )
          ) 
          FROM product_sizes ps 
          WHERE ps.product_id = p.id
          ), '[]'::json
        ) AS sizes,
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'image_id', i.image_id,
              'image_url', i.image_url
            )
          ) 
          FROM images i 
          WHERE i.product_id = p.id
          ), '[]'::json
        ) AS images,
        MIN(ps.price) AS min_price,
        SUM(ps.stock_quantity) AS total_stock
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN product_sizes ps ON p.id = ps.product_id
      WHERE p.id = $1
      GROUP BY p.id, p.title, p.description, p.category, p.type, p.animal_category, b.name
    `;
    const result = await pool.query(query, [id]);
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