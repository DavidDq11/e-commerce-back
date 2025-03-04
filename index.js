import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import productRoutes from './routes/productroutes.js';
import userRoutes from './routes/userRoutes.js'; // Corrected case sensitivity
import errorHandler from './middleware/errorHandler.js';

// Cargar variables de entorno
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json()); 
app.use(cors());

// Usar rutas de productos con prefijo /api
app.use('/api', productRoutes);
app.use('/api', userRoutes); // Mount user routes

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


app.use(express.json());


export default app; // Para pruebas y compatibilidad