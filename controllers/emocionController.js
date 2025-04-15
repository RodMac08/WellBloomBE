/*
Proyecto: WellBloom
Código del controlador de la tabla Emocion con operaciones CRUD
Creado: 14 de abril del 2025
Última actualización: 14 de abril del 2025
Última actualización hecha por: Rodrigo Macias Ruiz
*/

import pool from "../config/db.js";
import { validationResult } from "express-validator";
import { check } from "express-validator";

// Validaciones comunes reutilizables
export const emocionValidations = [
  check('nombre_emocion')
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ max: 100 }).withMessage('Máximo 100 caracteres'),
  check('puntaje_emocion')
    .optional()
    .isInt({ min: 1, max: 10 }).withMessage('Puntaje debe ser 1-10')
];

// Controlador de Emociones
export const emocionController = {
  // Obtener todas las emociones (con paginación)
  getAll: async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const [emociones] = await pool.query(
        "SELECT * FROM Emocion LIMIT ? OFFSET ?",
        [parseInt(limit), parseInt(offset)]
      );

      const [total] = await pool.query("SELECT COUNT(*) AS count FROM Emocion");

      res.json({
        data: emociones,
        pagination: {
          total: total[0].count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total[0].count / limit)
        }
      });
    } catch (error) {
      console.error("Error en getAll:", error);
      res.status(500).json({ message: "Error al obtener emociones" });
    }
  },

  // Obtener emoción por ID
  getById: async (req, res) => {
    try {
      const [emocion] = await pool.query(
        "SELECT * FROM Emocion WHERE id_emocion = ?",
        [req.params.id]
      );

      if (emocion.length === 0) {
        return res.status(404).json({ message: "Emoción no encontrada" });
      }

      res.json(emocion[0]);
    } catch (error) {
      console.error("Error en getById:", error);
      res.status(500).json({ message: "Error al obtener emoción" });
    }
  },

  // Crear nueva emoción
  create: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nombre_emocion, descripcion, puntaje_emocion } = req.body;

    try {
      // Verificar si ya existe
      const [existente] = await pool.query(
        "SELECT id_emocion FROM Emocion WHERE nombre_emocion = ?",
        [nombre_emocion]
      );

      if (existente.length > 0) {
        return res.status(409).json({ message: "Esta emoción ya existe" });
      }

      const [result] = await pool.query(
        "INSERT INTO Emocion (nombre_emocion, descripcion, puntaje_emocion) VALUES (?, ?, ?)",
        [nombre_emocion, descripcion, puntaje_emocion || null]
      );

      const [nuevaEmocion] = await pool.query(
        "SELECT * FROM Emocion WHERE id_emocion = ?",
        [result.insertId]
      );

      res.status(201).json(nuevaEmocion[0]);
    } catch (error) {
      console.error("Error en create:", error);
      res.status(500).json({ message: "Error al crear emoción" });
    }
  },

  // Actualizar emoción
  update: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { nombre_emocion, descripcion, puntaje_emocion } = req.body;

    try {
      // Verificar existencia
      const [existente] = await pool.query(
        "SELECT id_emocion FROM Emocion WHERE id_emocion = ?",
        [id]
      );

      if (existente.length === 0) {
        return res.status(404).json({ message: "Emoción no encontrada" });
      }

      await pool.query(
        `UPDATE Emocion 
        SET nombre_emocion = ?, descripcion = ?, puntaje_emocion = ?
        WHERE id_emocion = ?`,
        [nombre_emocion, descripcion, puntaje_emocion || null, id]
      );

      const [updatedEmocion] = await pool.query(
        "SELECT * FROM Emocion WHERE id_emocion = ?",
        [id]
      );

      res.json(updatedEmocion[0]);
    } catch (error) {
      console.error("Error en update:", error);
      res.status(500).json({ message: "Error al actualizar emoción" });
    }
  },

  // Eliminar emoción (con verificación de registros asociados)
  delete: async (req, res) => {
    const { id } = req.params;

    try {
      // Verificar si hay registros emocionales asociados
      const [registros] = await pool.query(
        "SELECT id_registro FROM RegistroEmocion WHERE id_emocion = ? LIMIT 1",
        [id]
      );

      if (registros.length > 0) {
        return res.status(400).json({ 
          message: "No se puede eliminar: existen registros asociados"
        });
      }

      const [result] = await pool.query(
        "DELETE FROM Emocion WHERE id_emocion = ?",
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Emoción no encontrada" });
      }

      res.json({ message: "Emoción eliminada correctamente" });
    } catch (error) {
      console.error("Error en delete:", error);
      res.status(500).json({ message: "Error al eliminar emoción" });
    }
  },

  // Endpoint especial: Obtener frases relacionadas
  getFrases: async (req, res) => {
    try {
      const [frases] = await pool.query(
        `SELECT f.id_frase, f.frase, f.autor 
        FROM Frases f
        WHERE f.id_emocion = ?`,
        [req.params.id]
      );

      res.json(frases);
    } catch (error) {
      console.error("Error en getFrases:", error);
      res.status(500).json({ message: "Error al obtener frases" });
    }
  }
};