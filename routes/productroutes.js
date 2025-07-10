import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

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
  stock: row.total_stock > 0 ? 'In stock' : 'Out of stock',
  rating: {
    rate: 0,
    count: 0
  }
});

const typeMap = {
  'DryFood': 'Pet Food',
  'WetFood': 'Wet Food',
  'Snacks': 'Pet Treats',
  'Litter': 'Litter'
};

router.get('/brands', async (req, res) => {
  try {
    const query = 'SELECT id, name, image_url AS image FROM brands ORDER BY name';
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error en /brands:', error.stack);
    res.status(500).json({ message: error.message });
  }
});

router.get('/products', async (req, res) => {
  try {
    const { category, brand_id, limit = 25, offset = 0, minPrice, maxPrice } = req.query;
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

    if (category && category !== 'all') {
      const mappedCategory = typeMap[category] || category;
      whereClauses.push('p.category = $' + (params.length + 1));
      params.push(mappedCategory);
    }

    if (brand_id) {
      whereClauses.push('p.brand_id = $' + (params.length + 1));
      params.push(Number(brand_id));
    }

    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses.join(' AND ');
    }

    query += ' GROUP BY p.id, p.title, p.description, p.category, p.type, p.animal_category, b.name';

    // Agregar filtros de precio con HAVING
    if (minPrice || maxPrice) {
      query += ' HAVING ';
      if (minPrice) {
        query += 'MIN(ps.price) >= $' + (params.length + 1);
        params.push(Number(minPrice));
      }
      if (maxPrice) {
        if (minPrice) query += ' AND ';
        query += 'MIN(ps.price) <= $' + (params.length + 1);
        params.push(Number(maxPrice));
      }
    }

    query += ' LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(Number(limit), Number(offset));

    const result = await pool.query(query, params);
    const transformed = result.rows.map(row => transformProduct(row));

    let countQuery = 'SELECT COUNT(DISTINCT p.id) FROM products p';
    countQuery += ' LEFT JOIN brands b ON p.brand_id = b.id';
    countQuery += ' LEFT JOIN product_sizes ps ON p.id = ps.product_id';
    let countParams = [];
    if (whereClauses.length > 0) {
      countQuery += ' WHERE ' + whereClauses.join(' AND ');
      countParams = params.slice(0, params.length - (minPrice || maxPrice ? 4 : 2));
    }
    if (minPrice || maxPrice) {
      countQuery += (whereClauses.length > 0 ? ' AND ' : ' WHERE ') + 'EXISTS (SELECT 1 FROM product_sizes ps2 WHERE ps2.product_id = p.id';
      if (minPrice) {
        countQuery += ' AND ps2.price >= $' + (countParams.length + 1);
        countParams.push(Number(minPrice));
      }
      if (maxPrice) {
        countQuery += ' AND ps2.price <= $' + (countParams.length + 1);
        countParams.push(Number(maxPrice));
      }
      countQuery += ')';
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

// Nueva ruta para filtrar productos por brand_id
router.get('/products/:brand_id', async (req, res) => {
  try {
    const { brand_id } = req.params;
    const { limit = 25, offset = 0 } = req.query;
    // console.log('Parámetros recibidos:', { brand_id, limit, offset });

    if (!brand_id || isNaN(Number(brand_id))) {
      return res.status(400).json({ message: 'ID de marca inválido' });
    }

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
      WHERE p.brand_id = $1
      GROUP BY p.id, p.title, p.description, p.category, p.type, p.animal_category, b.name
      LIMIT $2 OFFSET $3
    `;
    const params = [Number(brand_id), Number(limit), Number(offset)];

    // console.log('Consulta SQL:', query);
    // console.log('Parámetros SQL:', params);
    const result = await pool.query(query, params);
    const transformed = result.rows.map(row => transformProduct(row));

    const countQuery = 'SELECT COUNT(DISTINCT p.id) FROM products p WHERE p.brand_id = $1';
    const totalResult = await pool.query(countQuery, [Number(brand_id)]);
    const total = parseInt(totalResult.rows[0].count);

    // console.log('Productos encontrados:', transformed.length);
    res.status(200).json({
      products: transformed,
      total,
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    res.status(500).json({ message: error.message, stack: error.stack });
  }
});

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