/*
Proyecto: WellBloom
Código de punto de entrada para la conexión a la base de datos
Creado: 09 de marzo del 2025
Última actualización: 09 de marzo del 2025
Última actualización hecha por: Rodrigo Macias Ruiz
*/
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { testConnection } from "./config/db.js";

dotenv.config();
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta de prueba de conexión
app.get("/test-db", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.query("SELECT 1 + 1 AS result"); // Query de prueba
    connection.release();
    res.json({ success: true, message: "Conexión a la base de datos exitosa" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Iniciar servidor y probar conexión
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Servidor en http://localhost:${PORT}`);
  await testConnection(); // Probar conexión al iniciar
});