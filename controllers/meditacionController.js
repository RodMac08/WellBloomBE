/*
Proyecto: WellBloom
Código para agregar rutas del controlador de meditación
Creado: 15 de abril del 2025
Última actualización: 15 de abril del 2025
Última actualización hecha por: Rodrigo Macias Ruiz
*/

import pool from "../config/db.js";
import { validationResult } from "express-validator";
import { check } from "express-validator";

// Validaciones
export const meditacionValidations = [
  check('id_actividad')
    .isInt().withMessage('ID de actividad inválido')
    .custom(async (value, { req }) => {
      const [actividad] = await pool.query(
        "SELECT id_actividad FROM Actividad WHERE id_actividad = ?", 
        [value]
      );
      
      if (actividad.length === 0) {
        throw new Error('La actividad no existe');
      }

      // Verificar que la actividad no tenga ya una meditación asociada
      if (req.method === 'POST') {
        const [existente] = await pool.query(
          "SELECT id_meditacion FROM Meditacion WHERE id_actividad = ?",
          [value]
        );
        if (existente.length > 0) {
          throw new Error('Esta actividad ya tiene una meditación asociada');
        }
      }
    }),
  check('tiempo_meditacion')
    .isInt({ min: 1 }).withMessage('El tiempo debe ser un número positivo')
];

// Controlador de Meditación
export const meditacionController = {
  // Crear nueva sesión de meditación
  create: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id_actividad, tiempo_meditacion } = req.body;

    try {
      const [result] = await pool.query(
        `INSERT INTO Meditacion 
        (id_actividad, tiempo_meditacion) 
        VALUES (?, ?)`,
        [id_actividad, tiempo_meditacion]
      );

      // Obtener meditación creada con datos de actividad
      const [nuevaMeditacion] = await pool.query(`
        SELECT m.*, a.nombre_actividad
        FROM Meditacion m
        JOIN Actividad a ON m.id_actividad = a.id_actividad
        WHERE m.id_meditacion = ?
      `, [result.insertId]);

      res.status(201).json(nuevaMeditacion[0]);
    } catch (error) {
      console.error("Error en create:", error);
      res.status(500).json({ message: "Error al crear meditación" });
    }
  },

  // Obtener meditación por ID con datos completos
  getById: async (req, res) => {
    try {
      const [meditacion] = await pool.query(`
        SELECT m.*, a.nombre_actividad, a.descripcion
        FROM Meditacion m
        JOIN Actividad a ON m.id_actividad = a.id_actividad
        WHERE m.id_meditacion = ?
      `, [req.params.id]);

      if (meditacion.length === 0) {
        return res.status(404).json({ message: "Meditación no encontrada" });
      }

      res.json(meditacion[0]);
    } catch (error) {
      console.error("Error en getById:", error);
      res.status(500).json({ message: "Error al obtener meditación" });
    }
  },

  // Obtener meditación por actividad
  getByActividad: async (req, res) => {
    try {
      const [meditacion] = await pool.query(`
        SELECT m.*, a.nombre_actividad
        FROM Meditacion m
        JOIN Actividad a ON m.id_actividad = a.id_actividad
        WHERE m.id_actividad = ?
      `, [req.params.id]);

      if (meditacion.length === 0) {
        return res.status(404).json({ message: "No se encontró meditación para esta actividad" });
      }

      res.json(meditacion[0]);
    } catch (error) {
      console.error("Error en getByActividad:", error);
      res.status(500).json({ message: "Error al obtener meditación" });
    }
  },

  // Actualizar meditación
  update: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { tiempo_meditacion, completado } = req.body;

    try {
      await pool.query(
        `UPDATE Meditacion 
        SET tiempo_meditacion = ?, completado = ?
        WHERE id_meditacion = ?`,
        [tiempo_meditacion, completado, id]
      );

      const [updatedMeditacion] = await pool.query(`
        SELECT m.*, a.nombre_actividad
        FROM Meditacion m
        JOIN Actividad a ON m.id_actividad = a.id_actividad
        WHERE m.id_meditacion = ?
      `, [id]);

      res.json(updatedMeditacion[0]);
    } catch (error) {
      console.error("Error en update:", error);
      res.status(500).json({ message: "Error al actualizar meditación" });
    }
  },

  // Marcar como completada
  complete: async (req, res) => {
    try {
      const [result] = await pool.query(
        "UPDATE Meditacion SET completado = TRUE WHERE id_meditacion = ?",
        [req.params.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Meditación no encontrada" });
      }

      res.json({ message: "Meditación marcada como completada" });
    } catch (error) {
      console.error("Error en complete:", error);
      res.status(500).json({ message: "Error al completar meditación" });
    }
  },

  // Eliminar meditación
  delete: async (req, res) => {
    try {
      const [result] = await pool.query(
        "DELETE FROM Meditacion WHERE id_meditacion = ?",
        [req.params.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Meditación no encontrada" });
      }

      res.json({ message: "Meditación eliminada correctamente" });
    } catch (error) {
      console.error("Error en delete:", error);
      res.status(500).json({ message: "Error al eliminar meditación" });
    }
  },

  // Endpoint especial: Obtener meditaciones completadas
  getCompleted: async (req, res) => {
    try {
      const [meditaciones] = await pool.query(`
        SELECT m.*, a.nombre_actividad
        FROM Meditacion m
        JOIN Actividad a ON m.id_actividad = a.id_actividad
        WHERE m.completado = TRUE
      `);

      res.json(meditaciones);
    } catch (error) {
      console.error("Error en getCompleted:", error);
      res.status(500).json({ message: "Error al obtener meditaciones" });
    }
  }
};