import express from 'express';
import pool from '../config/db.js';
import { getProducts, getOrders } from '../services/rocketfy-service.js';

const router = express.Router();

// Function to transform database products
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
    count: row.rating_count,
  },
});

// Mapeo de categorías de la URL a tipos en la base de datos
const typeMap = {
  Food: 'Alimento',
  Toys: 'Juguete',
  Hygiene: 'Higiene',
  Accessories: 'Accesorio',
  Snacks: 'Snack',
  Habitats: 'Habitat',
  Equipment: 'Equipo',
  Supplements: 'Suplemento',
};

// Obtener todos los productos (con soporte para paginación y filtrado)
router.get('/products', async (req, res) => {
  try {
    const { category, type, limit = 1000, offset = 0 } = req.query;

    // Fetch database products
    let query = 'SELECT * FROM products';
    let params = [];

    if (category) {
      const mappedCategory = typeMap[category] || category;
      query += ' WHERE category = $1';
      params.push(mappedCategory);
    } else if (type) {
      const mappedType = typeMap[type] || type;
      query += ' WHERE type = $1';
      params.push(mappedType);
    }

    if (limit !== '1000' || offset !== '0') {
      query += ' LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
      params.push(Number(limit), Number(offset));
    }

    const result = await pool.query(query, params);
    const totalResult = await pool.query(
      'SELECT COUNT(*) FROM products' +
        (category ? ' WHERE category = $1' : type ? ' WHERE type = $1' : ''),
      category ? [typeMap[category] || category] : type ? [typeMap[type] || type] : []
    );
    const dbTotal = parseInt(totalResult.rows[0].count);
    const dbProducts = result.rows.map((row) => ({
      ...transformProduct(row),
      source: "Database", // Add source field for database products
    }));

    // Fetch Rocketfy products
    const rocketfyProducts = await getProducts();

    // Filter Rocketfy products by category or type if provided
    let filteredRocketfyProducts = rocketfyProducts;
    if (category) {
      const mappedCategory = typeMap[category] || category;
      filteredRocketfyProducts = rocketfyProducts.filter(
        (product) => product.category === mappedCategory
      );
    } else if (type) {
      const mappedType = typeMap[type] || type;
      filteredRocketfyProducts = rocketfyProducts.filter(
        (product) => product.type === mappedType
      );
    }

    // Merge database and Rocketfy products
    const allProducts = [...dbProducts, ...filteredRocketfyProducts];
    const total = dbTotal + filteredRocketfyProducts.length;

    // Apply pagination to the merged list
    const paginatedProducts = allProducts.slice(
      Number(offset),
      Number(offset) + Number(limit)
    );

    if (!req.query.limit && !req.query.offset && !req.query.category && !req.query.type) {
      return res.status(200).json(allProducts);
    }

    res.status(200).json({
      products: paginatedProducts,
      total,
      page: Math.floor(Number(offset) / Number(limit)) + 1,
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error('Error en /products:', error);
    res.status(500).json({ message: error.message });
  }
});

// Obtener un producto por ID
router.get('/product/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    // Check if the ID is a Rocketfy product
    if (id.startsWith('rocketfy-')) {
      const rocketfyProducts = await getProducts();
      const rocketfyIndex = parseInt(id.replace('rocketfy-', ''));
      const rocketfyProduct = rocketfyProducts[rocketfyIndex];
      if (!rocketfyProduct) {
        return res.status(404).json({ message: 'Producto de Rocketfy no encontrado' });
      }
      return res.status(200).json(rocketfyProduct);
    }

    // Otherwise, fetch from the database
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

// Keep the /rocketfy-products endpoint for debugging or separate access
router.get('/rocketfy-products', async (req, res) => {
  try {
    const products = await getProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener productos de Rocketfy' });
  }
});

// Keep the /rocketfy-orders endpoint
router.get('/rocketfy-orders', async (req, res) => {
  try {
    const orders = await getOrders();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener órdenes' });
  }
});

export default router;