/*
Proyecto: WellBloom
Código para agregar rutas del controlador de ejercicios
Creado: 15 de abril del 2025
Última actualización: 15 de abril del 2025
Última actualización hecha por: Rodrigo Macias Ruiz
*/

import pool from "../config/db.js";
import { validationResult } from "express-validator";
import { check } from "express-validator";

// Validaciones
export const ejercicioValidations = [
  check('id_actividad')
    .isInt().withMessage('ID de actividad inválido')
    .custom(async (value) => {
      const [actividad] = await pool.query(
        "SELECT id_actividad FROM Actividad WHERE id_actividad = ?", 
        [value]
      );
      if (actividad.length === 0) {
        throw new Error('La actividad no existe');
      }
    }),
  check('turno')
    .optional()
    .isIn(['mañana', 'tarde', 'noche']).withMessage('Turno no válido'),
  check('tiempo')
    .optional()
    .isInt({ min: 1 }).withMessage('El tiempo debe ser positivo')
];

// Controlador de Ejercicios
export const ejercicioController = {
  // Crear nuevo ejercicio
  create: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id_actividad, turno, tiempo } = req.body;

    try {
      const [result] = await pool.query(
        `INSERT INTO Ejercicio 
        (id_actividad, turno, tiempo) 
        VALUES (?, ?, ?)`,
        [id_actividad, turno || null, tiempo || null]
      );

      // Obtener ejercicio creado con nombre de actividad
      const [nuevoEjercicio] = await pool.query(`
        SELECT e.*, a.nombre_actividad 
        FROM Ejercicio e
        JOIN Actividad a ON e.id_actividad = a.id_actividad
        WHERE e.id_ejercicio = ?
      `, [result.insertId]);

      res.status(201).json(nuevoEjercicio[0]);
    } catch (error) {
      console.error("Error en create:", error);
      res.status(500).json({ message: "Error al crear ejercicio" });
    }
  },

  // Obtener todos los ejercicios de una actividad
  getByActividad: async (req, res) => {
    try {
      const [ejercicios] = await pool.query(`
        SELECT e.*, a.nombre_actividad
        FROM Ejercicio e
        JOIN Actividad a ON e.id_actividad = a.id_actividad
        WHERE e.id_actividad = ?
      `, [req.params.id]);

      res.json(ejercicios);
    } catch (error) {
      console.error("Error en getByActividad:", error);
      res.status(500).json({ message: "Error al obtener ejercicios" });
    }
  },

  // Actualizar ejercicio
  update: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { turno, tiempo, completado } = req.body;

    try {
      // Verificar existencia
      const [existente] = await pool.query(
        "SELECT id_ejercicio FROM Ejercicio WHERE id_ejercicio = ?",
        [id]
      );

      if (existente.length === 0) {
        return res.status(404).json({ message: "Ejercicio no encontrado" });
      }

      await pool.query(
        `UPDATE Ejercicio 
        SET turno = ?, tiempo = ?, completado = ?
        WHERE id_ejercicio = ?`,
        [turno || null, tiempo || null, completado, id]
      );

      const [updatedEjercicio] = await pool.query(`
        SELECT e.*, a.nombre_actividad
        FROM Ejercicio e
        JOIN Actividad a ON e.id_actividad = a.id_actividad
        WHERE e.id_ejercicio = ?
      `, [id]);

      res.json(updatedEjercicio[0]);
    } catch (error) {
      console.error("Error en update:", error);
      res.status(500).json({ message: "Error al actualizar ejercicio" });
    }
  },

  // Marcar ejercicio como completado
  complete: async (req, res) => {
    try {
      const [result] = await pool.query(
        "UPDATE Ejercicio SET completado = TRUE WHERE id_ejercicio = ?",
        [req.params.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Ejercicio no encontrado" });
      }

      res.json({ message: "Ejercicio marcado como completado" });
    } catch (error) {
      console.error("Error en complete:", error);
      res.status(500).json({ message: "Error al completar ejercicio" });
    }
  },

  // Eliminar ejercicio
  delete: async (req, res) => {
    try {
      const [result] = await pool.query(
        "DELETE FROM Ejercicio WHERE id_ejercicio = ?",
        [req.params.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Ejercicio no encontrado" });
      }

      res.json({ message: "Ejercicio eliminado correctamente" });
    } catch (error) {
      console.error("Error en delete:", error);
      res.status(500).json({ message: "Error al eliminar ejercicio" });
    }
  },

  // Endpoint especial: Obtener ejercicios por turno
  getByTurno: async (req, res) => {
    const { turno } = req.params;
    
    try {
      const [ejercicios] = await pool.query(`
        SELECT e.*, a.nombre_actividad
        FROM Ejercicio e
        JOIN Actividad a ON e.id_actividad = a.id_actividad
        WHERE e.turno = ?
      `, [turno]);

      res.json(ejercicios);
    } catch (error) {
      console.error("Error en getByTurno:", error);
      res.status(500).json({ message: "Error al obtener ejercicios" });
    }
  }
};