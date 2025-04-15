/*
Proyecto: WellBloom
Código para agregar rutas del controlador de bitacora
Creado: 15 de abril del 2025
Última actualización: 15 de abril del 2025
Última actualización hecha por: Rodrigo Macias Ruiz
*/

import pool from "../config/db.js";
import { validationResult } from "express-validator";
import { check } from "express-validator";

// Validaciones
export const bitacoraValidations = [
  check('id_usuario')
    .isInt().withMessage('ID de usuario inválido')
    .custom(async (value) => {
      const [usuario] = await pool.query(
        "SELECT id_usuario FROM Usuarios WHERE id_usuario = ?", 
        [value]
      );
      if (usuario.length === 0) {
        throw new Error('El usuario no existe');
      }
    }),
  check('id_registro')
    .isInt().withMessage('ID de registro inválido')
    .custom(async (value) => {
      const [registro] = await pool.query(
        "SELECT id_registro FROM RegistroEmocion WHERE id_registro = ?", 
        [value]
      );
      if (registro.length === 0) {
        throw new Error('El registro emocional no existe');
      }
    }),
  check('nota')
    .optional()
    .isLength({ max: 1000 }).withMessage('Máximo 1000 caracteres')
];

// Controlador de Bitácora
export const bitacoraController = {
  // Crear nuevo registro en bitácora
  create: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id_usuario, id_registro, nota } = req.body;

    try {
      // Verificar que el registro emocional pertenece al usuario
      const [registro] = await pool.query(
        "SELECT id_usuario FROM RegistroEmocion WHERE id_registro = ?",
        [id_registro]
      );

      if (registro.length === 0 || registro[0].id_usuario !== parseInt(id_usuario)) {
        return res.status(403).json({ 
          message: "El registro emocional no pertenece a este usuario" 
        });
      }

      const [result] = await pool.query(
        `INSERT INTO Bitacora 
        (id_usuario, id_registro, nota) 
        VALUES (?, ?, ?)`,
        [id_usuario, id_registro, nota || null]
      );

      // Obtener registro completo con datos relacionados
      const [nuevaEntrada] = await pool.query(`
        SELECT b.*, 
               u.nombre AS usuario_nombre,
               re.hora_foto,
               e.nombre_emocion
        FROM Bitacora b
        JOIN Usuarios u ON b.id_usuario = u.id_usuario
        JOIN RegistroEmocion re ON b.id_registro = re.id_registro
        JOIN Emocion e ON re.id_emocion = e.id_emocion
        WHERE b.id_bitacora = ?
      `, [result.insertId]);

      res.status(201).json(nuevaEntrada[0]);
    } catch (error) {
      console.error("Error en create:", error);
      res.status(500).json({ message: "Error al crear registro en bitácora" });
    }
  },

  // Obtener entradas de bitácora por usuario
  getByUsuario: async (req, res) => {
    const { id } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    try {
      const [entradas] = await pool.query(`
        SELECT b.*, 
               re.hora_foto,
               e.nombre_emocion,
               e.puntaje_emocion
        FROM Bitacora b
        JOIN RegistroEmocion re ON b.id_registro = re.id_registro
        JOIN Emocion e ON re.id_emocion = e.id_emocion
        WHERE b.id_usuario = ?
        ORDER BY b.id_bitacora DESC
        LIMIT ? OFFSET ?
      `, [id, parseInt(limit), parseInt(offset)]);

      const [total] = await pool.query(
        "SELECT COUNT(*) AS count FROM Bitacora WHERE id_usuario = ?",
        [id]
      );

      res.json({
        data: entradas,
        pagination: {
          total: total[0].count,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error) {
      console.error("Error en getByUsuario:", error);
      res.status(500).json({ message: "Error al obtener registros" });
    }
  },

  // Obtener entrada específica con todos los datos relacionados
  getById: async (req, res) => {
    try {
      const [entrada] = await pool.query(`
        SELECT b.*,
               u.nombre AS usuario_nombre,
               u.correo AS usuario_correo,
               re.hora_foto,
               e.nombre_emocion,
               e.descripcion AS descripcion_emocion,
               e.puntaje_emocion
        FROM Bitacora b
        JOIN Usuarios u ON b.id_usuario = u.id_usuario
        JOIN RegistroEmocion re ON b.id_registro = re.id_registro
        JOIN Emocion e ON re.id_emocion = e.id_emocion
        WHERE b.id_bitacora = ?
      `, [req.params.id]);

      if (entrada.length === 0) {
        return res.status(404).json({ message: "Entrada no encontrada" });
      }

      res.json(entrada[0]);
    } catch (error) {
      console.error("Error en getById:", error);
      res.status(500).json({ message: "Error al obtener entrada" });
    }
  },

  // Actualizar nota en bitácora
  updateNota: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { nota } = req.body;

    try {
      await pool.query(
        "UPDATE Bitacora SET nota = ? WHERE id_bitacora = ?",
        [nota || null, id]
      );

      const [updatedEntrada] = await pool.query(
        "SELECT * FROM Bitacora WHERE id_bitacora = ?",
        [id]
      );

      res.json(updatedEntrada[0]);
    } catch (error) {
      console.error("Error en updateNota:", error);
      res.status(500).json({ message: "Error al actualizar nota" });
    }
  },

  // Eliminar entrada de bitácora
  delete: async (req, res) => {
    try {
      const [result] = await pool.query(
        "DELETE FROM Bitacora WHERE id_bitacora = ?",
        [req.params.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Entrada no encontrada" });
      }

      res.json({ message: "Entrada eliminada correctamente" });
    } catch (error) {
      console.error("Error en delete:", error);
      res.status(500).json({ message: "Error al eliminar entrada" });
    }
  },

  // Endpoint especial: Obtener resumen emocional por usuario
  getResumenEmocional: async (req, res) => {
    const { id } = req.params;
    const { dias = 30 } = req.query;

    try {
      const [resumen] = await pool.query(`
        SELECT 
          e.nombre_emocion,
          COUNT(b.id_bitacora) AS total_registros,
          AVG(e.puntaje_emocion) AS promedio_puntaje,
          MIN(re.hora_foto) AS primera_vez,
          MAX(re.hora_foto) AS ultima_vez
        FROM Bitacora b
        JOIN RegistroEmocion re ON b.id_registro = re.id_registro
        JOIN Emocion e ON re.id_emocion = e.id_emocion
        WHERE b.id_usuario = ? 
          AND re.hora_foto >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY e.id_emocion
        ORDER BY total_registros DESC
      `, [id, parseInt(dias)]);

      res.json(resumen);
    } catch (error) {
      console.error("Error en getResumenEmocional:", error);
      res.status(500).json({ message: "Error al generar resumen" });
    }
  }
};