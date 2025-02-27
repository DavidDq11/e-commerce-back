const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const cors = require('cors');
const productRoutes = require('./routes/productroutes');
const errorHandler = require('./middleware/errorHandler');

app.use(express.json()); // Middleware para parsear JSON
app.use(cors()); // Habilita CORS para todas las solicitudes

// Middleware personalizado para CORS (opcional, ya cubierto por cors())
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Usar rutas de productos con prefijo /api
app.use('/api', productRoutes);

// Ruta raíz para probar el servidor
app.get('/', (req, res) => {
  res.send('¡Backend conectado a Neon Tech!');
});

// Middleware de manejo de errores
app.use(errorHandler);

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});

const corsOptions = {
  origin: 'http://localhost:4200', // Add your deployed frontend URL later
  optionsSuccessStatus: 200 // For legacy browser support
};
app.use(cors(corsOptions));

module.exports = app; // Opcional, para pruebas