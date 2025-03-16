/*
Proyecto: WellBloom
Código del controlador de la tabla RegistroEmocion con operaciones CRUD
Creado: 09 de marzo del 2025
Última actualización: 09 de marzo del 2025
Última actualización hecha por: Rodrigo Macias Ruiz
*/
import pool from "../config/db.js";
import { validationResult } from "express-validator";

// Controlador de RegistroEmocion
export const registroEmocionController = {
  // Obtener todos los registros con datos relacionados
  getAllRegistros: async (req, res) => {
    try {
      const [registros] = await pool.query(`
        SELECT re.id_registro, re.hora_foto,
               u.id_usuario, u.nombre AS usuario_nombre,
               e.id_emocion, e.nombre_emocion
        FROM RegistroEmocion re
        JOIN Usuarios u ON re.id_usuario = u.id_usuario
        JOIN Emocion e ON re.id_emocion = e.id_emocion
      `);
      res.json(registros);
    } catch (error) {
      console.error("Error en getAllRegistros:", error);
      res.status(500).json({ message: "Error al obtener los registros" });
    }
  },

  // Crear nuevo registro con validación de existencia
  createRegistro: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id_usuario, id_emocion } = req.body;

    try {
      // Verificar existencia de usuario y emoción
      const [usuario] = await pool.query(
        "SELECT id_usuario FROM Usuarios WHERE id_usuario = ?",
        [id_usuario]
      );
      
      const [emocion] = await pool.query(
        "SELECT id_emocion FROM Emocion WHERE id_emocion = ?",
        [id_emocion]
      );

      if (usuario.length === 0) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      if (emocion.length === 0) {
        return res.status(404).json({ message: "Emoción no encontrada" });
      }

      // Crear registro
      const [result] = await pool.query(
        "INSERT INTO RegistroEmocion (id_usuario, id_emocion) VALUES (?, ?)",
        [id_usuario, id_emocion]
      );

      // Obtener registro creado con datos relacionados
      const [newRegistro] = await pool.query(`
        SELECT re.id_registro, re.hora_foto,
               u.nombre AS usuario_nombre,
               e.nombre_emocion
        FROM RegistroEmocion re
        JOIN Usuarios u ON re.id_usuario = u.id_usuario
        JOIN Emocion e ON re.id_emocion = e.id_emocion
        WHERE re.id_registro = ?
      `, [result.insertId]);

      res.status(201).json(newRegistro[0]);
    } catch (error) {
      console.error("Error en createRegistro:", error);
      res.status(500).json({ message: "Error al crear el registro" });
    }
  },

  // Obtener registros por usuario con paginación
  getRegistrosByUsuario: async (req, res) => {
    const { id } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    try {
      const [registros] = await pool.query(`
        SELECT re.id_registro, re.hora_foto,
               e.nombre_emocion, e.puntaje_emocion
        FROM RegistroEmocion re
        JOIN Emocion e ON re.id_emocion = e.id_emocion
        WHERE re.id_usuario = ?
        ORDER BY re.hora_foto DESC
        LIMIT ? OFFSET ?
      `, [id, parseInt(limit), parseInt(offset)]);

      const [total] = await pool.query(
        "SELECT COUNT(*) AS total FROM RegistroEmocion WHERE id_usuario = ?",
        [id]
      );

      res.json({
        data: registros,
        pagination: {
          total: total[0].total,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error) {
      console.error("Error en getRegistrosByUsuario:", error);
      res.status(500).json({ message: "Error al obtener registros" });
    }
  },

  // Eliminar registro con validación de existencia
  deleteRegistro: async (req, res) => {
    const { id } = req.params;

    try {
      const [result] = await pool.query(
        "DELETE FROM RegistroEmocion WHERE id_registro = ?",
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Registro no encontrado" });
      }

      res.json({ message: "Registro eliminado correctamente" });
    } catch (error) {
      console.error("Error en deleteRegistro:", error);
      res.status(500).json({ message: "Error al eliminar el registro" });
    }
  },

  // Obtener estadísticas de emociones por usuario
  getEstadisticasUsuario: async (req, res) => {
    const { id } = req.params;

    try {
      const [stats] = await pool.query(`
        SELECT e.nombre_emocion, COUNT(*) AS total,
               AVG(e.puntaje_emocion) AS promedio_puntaje
        FROM RegistroEmocion re
        JOIN Emocion e ON re.id_emocion = e.id_emocion
        WHERE re.id_usuario = ?
        GROUP BY e.id_emocion
        ORDER BY total DESC
      `, [id]);

      res.json(stats);
    } catch (error) {
      console.error("Error en getEstadisticasUsuario:", error);
      res.status(500).json({ message: "Error al obtener estadísticas" });
    }
  }
};