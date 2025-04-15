/*
Proyecto: WellBloom
Código del controlador de la tabla Actividad con operaciones CRUD
Creado: 14 de abril del 2025
Última actualización: 14 de abril del 2025
Última actualización hecha por: Rodrigo Macias Ruiz
*/

import pool from "../config/db.js";
import { validationResult } from "express-validator";

// Validaciones
export const actividadValidations = [
  check('nombre_actividad')
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ max: 255 }).withMessage('Máximo 255 caracteres'),
  check('tiempo_actividad')
    .optional()
    .isInt({ min: 1 }).withMessage('El tiempo debe ser positivo')
];

// Controlador de Actividades
export const actividadController = {
  // Obtener todas las actividades con sus relaciones
  getAll: async (req, res) => {
    try {
      const [actividades] = await pool.query(`
        SELECT a.*, 
               COUNT(e.id_ejercicio) AS total_ejercicios,
               m.id_meditacion
        FROM Actividad a
        LEFT JOIN Ejercicio e ON a.id_actividad = e.id_actividad
        LEFT JOIN Meditacion m ON a.id_actividad = m.id_actividad
        GROUP BY a.id_actividad
      `);
      res.json(actividades);
    } catch (error) {
      console.error("Error en getAll:", error);
      res.status(500).json({ message: "Error al obtener actividades" });
    }
  },

  // Crear nueva actividad
  create: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nombre_actividad, descripcion, tiempo_actividad } = req.body;

    try {
      const [result] = await pool.query(
        `INSERT INTO Actividad 
        (nombre_actividad, descripcion, tiempo_actividad) 
        VALUES (?, ?, ?)`,
        [nombre_actividad, descripcion, tiempo_actividad || null]
      );

      const [nuevaActividad] = await pool.query(
        "SELECT * FROM Actividad WHERE id_actividad = ?",
        [result.insertId]
      );

      res.status(201).json(nuevaActividad[0]);
    } catch (error) {
      console.error("Error en create:", error);
      res.status(500).json({ message: "Error al crear actividad" });
    }
  },

  // Obtener actividad específica con sus relaciones
  getById: async (req, res) => {
    try {
      const [actividad] = await pool.query(
        "SELECT * FROM Actividad WHERE id_actividad = ?",
        [req.params.id]
      );

      if (actividad.length === 0) {
        return res.status(404).json({ message: "Actividad no encontrada" });
      }

      // Obtener ejercicios asociados
      const [ejercicios] = await pool.query(
        "SELECT * FROM Ejercicio WHERE id_actividad = ?",
        [req.params.id]
      );

      // Obtener meditación asociada (si existe)
      const [meditacion] = await pool.query(
        "SELECT * FROM Meditacion WHERE id_actividad = ?",
        [req.params.id]
      );

      res.json({
        ...actividad[0],
        ejercicios,
        meditacion: meditacion[0] || null
      });
    } catch (error) {
      console.error("Error en getById:", error);
      res.status(500).json({ message: "Error al obtener actividad" });
    }
  },

  // Actualizar actividad
  update: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { nombre_actividad, descripcion, tiempo_actividad } = req.body;

    try {
      await pool.query(
        `UPDATE Actividad 
        SET nombre_actividad = ?, descripcion = ?, tiempo_actividad = ?
        WHERE id_actividad = ?`,
        [nombre_actividad, descripcion, tiempo_actividad || null, id]
      );

      const [updatedActividad] = await pool.query(
        "SELECT * FROM Actividad WHERE id_actividad = ?",
        [id]
      );

      res.json(updatedActividad[0]);
    } catch (error) {
      console.error("Error en update:", error);
      res.status(500).json({ message: "Error al actualizar actividad" });
    }
  },

  // Eliminar actividad (con verificación de relaciones)
  delete: async (req, res) => {
    const { id } = req.params;

    try {
      // Verificar si tiene ejercicios asociados
      const [ejercicios] = await pool.query(
        "SELECT id_ejercicio FROM Ejercicio WHERE id_actividad = ? LIMIT 1",
        [id]
      );

      // Verificar si tiene meditación asociada
      const [meditacion] = await pool.query(
        "SELECT id_meditacion FROM Meditacion WHERE id_actividad = ? LIMIT 1",
        [id]
      );

      if (ejercicios.length > 0 || meditacion.length > 0) {
        return res.status(400).json({ 
          message: "No se puede eliminar: tiene ejercicios o meditaciones asociadas"
        });
      }

      const [result] = await pool.query(
        "DELETE FROM Actividad WHERE id_actividad = ?",
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Actividad no encontrada" });
      }

      res.json({ message: "Actividad eliminada correctamente" });
    } catch (error) {
      console.error("Error en delete:", error);
      res.status(500).json({ message: "Error al eliminar actividad" });
    }
  },

  // Endpoint especial: Buscar actividades por nombre
  search: async (req, res) => {
    const { query } = req.query;

    try {
      const [actividades] = await pool.query(
        `SELECT * FROM Actividad 
        WHERE nombre_actividad LIKE ?`,
        [`%${query}%`]
      );

      res.json(actividades);
    } catch (error) {
      console.error("Error en search:", error);
      res.status(500).json({ message: "Error en búsqueda" });
    }
  }
};