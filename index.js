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
        // Transformar rating_rate y rating_count a un objeto "rating" para coincidir con tu JSON original
        const transformed = result.rows.map(row => ({
            ...row,
            rating: {
                rate: row.rating_rate,
                count: row.rating_count
            },
            rating_rate: undefined,
            rating_count: undefined
        }));
        res.json(transformed);
    } catch (error) {
        console.error('Error al consultar la base de datos:', error);
        res.status(500).send('Error en el servidor');
    }
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});