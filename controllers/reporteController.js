/*
Proyecto: WellBloom
Código para agregar rutas del controlador de reporte
Creado: 15 de abril del 2025
Última actualización: 15 de abril del 2025
Última actualización hecha por: Rodrigo Macias Ruiz
*/

import pool from "../config/db.js";
import { validationResult } from "express-validator";
import { check } from "express-validator";

// Validaciones
export const reporteValidations = [
  check('pregunta')
    .notEmpty().withMessage('La pregunta es obligatoria')
    .isLength({ max: 255 }).withMessage('Máximo 255 caracteres'),
  check('id_administrador')
    .isInt().withMessage('ID de administrador inválido')
    .custom(async (value) => {
      const [admin] = await pool.query(
        "SELECT id_administrador FROM Administrador WHERE id_administrador = ?", 
        [value]
      );
      if (admin.length === 0) {
        throw new Error('El administrador no existe');
      }
    }),
  check('respuesta')
    .optional()
    .isLength({ max: 1000 }).withMessage('Máximo 1000 caracteres')
];

// Controlador de Reportes
export const reporteController = {
  // Crear nuevo reporte
  create: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id_administrador, pregunta, respuesta, nota } = req.body;

    try {
      const [result] = await pool.query(
        `INSERT INTO Reporte 
        (id_administrador, pregunta, respuesta, nota) 
        VALUES (?, ?, ?, ?)`,
        [id_administrador, pregunta, respuesta || null, nota || null]
      );

      // Obtener reporte creado con datos de administrador
      const [nuevoReporte] = await pool.query(`
        SELECT r.*, 
               a.nombre AS admin_nombre,
               a.rol AS admin_rol
        FROM Reporte r
        JOIN Administrador a ON r.id_administrador = a.id_administrador
        WHERE r.id_reporte = ?
      `, [result.insertId]);

      res.status(201).json(nuevoReporte[0]);
    } catch (error) {
      console.error("Error en create:", error);
      res.status(500).json({ message: "Error al crear reporte" });
    }
  },

  // Obtener todos los reportes con filtros
  getAll: async (req, res) => {
    const { contestado, admin_id, limit = 10, offset = 0 } = req.query;

    try {
      let query = `
        SELECT r.*, 
               a.nombre AS admin_nombre,
               a.rol AS admin_rol
        FROM Reporte r
        JOIN Administrador a ON r.id_administrador = a.id_administrador
      `;
      const params = [];
      const conditions = [];

      if (contestado) {
        conditions.push("r.respuesta IS " + (contestado === 'true' ? 'NOT NULL' : 'NULL'));
      }

      if (admin_id) {
        conditions.push("r.id_administrador = ?");
        params.push(admin_id);
      }

      if (conditions.length) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " ORDER BY r.id_reporte DESC LIMIT ? OFFSET ?";
      params.push(parseInt(limit), parseInt(offset));

      const [reportes] = await pool.query(query, params);

      // Obtener conteo total para paginación
      let countQuery = "SELECT COUNT(*) AS total FROM Reporte";
      if (conditions.length) {
        countQuery += " WHERE " + conditions.join(" AND ");
      }

      const [total] = await pool.query(countQuery, params.slice(0, -2));

      res.json({
        data: reportes,
        pagination: {
          total: total[0].total,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error) {
      console.error("Error en getAll:", error);
      res.status(500).json({ message: "Error al obtener reportes" });
    }
  },

  // Obtener reporte por ID con datos completos
  getById: async (req, res) => {
    try {
      const [reporte] = await pool.query(`
        SELECT r.*,
               a.nombre AS admin_nombre,
               a.correo AS admin_correo,
               a.rol AS admin_rol
        FROM Reporte r
        JOIN Administrador a ON r.id_administrador = a.id_administrador
        WHERE r.id_reporte = ?
      `, [req.params.id]);

      if (reporte.length === 0) {
        return res.status(404).json({ message: "Reporte no encontrado" });
      }

      res.json(reporte[0]);
    } catch (error) {
      console.error("Error en getById:", error);
      res.status(500).json({ message: "Error al obtener reporte" });
    }
  },

  // Actualizar respuesta de reporte
  updateRespuesta: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { respuesta, nota } = req.body;

    try {
      await pool.query(
        `UPDATE Reporte 
        SET respuesta = ?, nota = ?, fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id_reporte = ?`,
        [respuesta || null, nota || null, id]
      );

      const [updatedReporte] = await pool.query(
        "SELECT * FROM Reporte WHERE id_reporte = ?",
        [id]
      );

      res.json(updatedReporte[0]);
    } catch (error) {
      console.error("Error en updateRespuesta:", error);
      res.status(500).json({ message: "Error al actualizar reporte" });
    }
  },

  // Eliminar reporte
  delete: async (req, res) => {
    try {
      const [result] = await pool.query(
        "DELETE FROM Reporte WHERE id_reporte = ?",
        [req.params.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Reporte no encontrado" });
      }

      res.json({ message: "Reporte eliminado correctamente" });
    } catch (error) {
      console.error("Error en delete:", error);
      res.status(500).json({ message: "Error al eliminar reporte" });
    }
  },

  // Endpoint especial: Obtener estadísticas de reportes
  getEstadisticas: async (req, res) => {
    try {
      const [stats] = await pool.query(`
        SELECT 
          COUNT(*) AS total_reportes,
          COUNT(respuesta) AS reportes_contestados,
          a.rol,
          COUNT(CASE WHEN r.respuesta IS NULL THEN 1 END) AS reportes_pendientes
        FROM Reporte r
        JOIN Administrador a ON r.id_administrador = a.id_administrador
        GROUP BY a.rol
      `);

      res.json(stats);
    } catch (error) {
      console.error("Error en getEstadisticas:", error);
      res.status(500).json({ message: "Error al obtener estadísticas" });
    }
  }
};