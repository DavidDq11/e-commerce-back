const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Configuración del cliente PostgreSQL para Neon Tech
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Necesario para Neon Tech
});

const cors = require('cors');
app.use(cors()); // Habilita CORS para todas las solicitudes

// Middleware para permitir CORS (para que Angular pueda acceder)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Middleware para parsear JSON (si planeas enviar datos al backend)
app.use(express.json());

// Ruta raíz para probar el servidor
app.get('/', (req, res) => {
    res.send('¡Backend conectado a Neon Tech!');
});

// Endpoint para obtener todos los productos
app.get('/products', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM products');
      const transformed = result.rows.map(row => ({
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
      }));
      res.json(transformed);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});