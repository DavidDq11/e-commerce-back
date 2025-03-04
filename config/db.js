import pkg from 'pg';  // ⬅️ Importa todo el paquete `pg`
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg; // ⬅️ Extrae `Pool` desde `pkg`

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Necesario para Neon Tech
});

export default pool; // ⬅️ Usa export default en lugar de module.exports
