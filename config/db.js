/*
Proyecto: WellBloom
Código para la configuración de la base de datos
Creado: 09 de marzo del 2025
Última actualización: 09 de marzo del 2025
Última actualización hecha por: Rodrigo Macias Ruiz
*/
import mysql from "mysql2/promise";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config();

// Crear el pool de conexiones
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

// Función para probar la conexión
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Conexión a la base de datos exitosa");
    connection.release();
  } catch (error) {
    console.error("❌ Error al conectar a la base de datos:", error.message);
  }
};

export default pool;