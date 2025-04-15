/*
Proyecto: WellBloom
Código para agregar rutas del controlador de frases
Creado: 15 de abril del 2025
Última actualización: 15 de abril del 2025
Última actualización hecha por: Rodrigo Macias Ruiz
*/

import pool from "../config/db.js";
import { validationResult } from "express-validator";
import { check } from "express-validator";

// Validaciones
export const frasesValidations = [
  check('frase')
    .notEmpty().withMessage('La frase es obligatoria')
    .isLength({ max: 255 }).withMessage('Máximo 255 caracteres'),
  check('autor')
    .optional()
    .isLength({ max: 255 }).withMessage('Máximo 255 caracteres'),
  check('id_emocion')
    .isInt().withMessage('ID de emoción inválido')
    .custom(async (value) => {
      const [emocion] = await pool.query(
        "SELECT id_emocion FROM Emocion WHERE id_emocion = ?", 
        [value]
      );
      if (emocion.length === 0) {
        throw new Error('La emoción no existe');
      }
    })
];

// Controlador de Frases
export const frasesController = {
  // Obtener todas las frases con datos de emoción
  getAll: async (req, res) => {
    try {
      const [frases] = await pool.query(`
        SELECT f.*, e.nombre_emocion 
        FROM Frases f
        JOIN Emocion e ON f.id_emocion = e.id_emocion
      `);
      res.json(frases);
    } catch (error) {
      console.error("Error en getAll:", error);
      res.status(500).json({ message: "Error al obtener frases" });
    }
  },

  // Crear nueva frase
  create: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { frase, autor, id_emocion } = req.body;

    try {
      const [result] = await pool.query(
        `INSERT INTO Frases 
        (frase, autor, id_emocion) 
        VALUES (?, ?, ?)`,
        [frase, autor || null, id_emocion]
      );

      // Obtener frase creada con datos de emoción
      const [nuevaFrase] = await pool.query(`
        SELECT f.*, e.nombre_emocion
        FROM Frases f
        JOIN Emocion e ON f.id_emocion = e.id_emocion
        WHERE f.id_frase = ?
      `, [result.insertId]);

      res.status(201).json(nuevaFrase[0]);
    } catch (error) {
      console.error("Error en create:", error);
      res.status(500).json({ message: "Error al crear frase" });
    }
  },

  // Obtener frases por emoción
  getByEmocion: async (req, res) => {
    try {
      const [frases] = await pool.query(`
        SELECT f.*, e.nombre_emocion
        FROM Frases f
        JOIN Emocion e ON f.id_emocion = e.id_emocion
        WHERE f.id_emocion = ?
      `, [req.params.id]);

      if (frases.length === 0) {
        return res.status(404).json({ 
          message: "No se encontraron frases para esta emoción" 
        });
      }

      res.json(frases);
    } catch (error) {
      console.error("Error en getByEmocion:", error);
      res.status(500).json({ message: "Error al obtener frases" });
    }
  },

  // Obtener frase aleatoria por emoción
  getRandomByEmocion: async (req, res) => {
    try {
      const [frases] = await pool.query(`
        SELECT f.*, e.nombre_emocion
        FROM Frases f
        JOIN Emocion e ON f.id_emocion = e.id_emocion
        WHERE f.id_emocion = ?
        ORDER BY RAND()
        LIMIT 1
      `, [req.params.id]);

      if (frases.length === 0) {
        return res.status(404).json({ 
          message: "No se encontraron frases para esta emoción" 
        });
      }

      res.json(frases[0]);
    } catch (error) {
      console.error("Error en getRandomByEmocion:", error);
      res.status(500).json({ message: "Error al obtener frase aleatoria" });
    }
  },

  // Actualizar frase
  update: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { frase, autor, id_emocion } = req.body;

    try {
      await pool.query(
        `UPDATE Frases 
        SET frase = ?, autor = ?, id_emocion = ?
        WHERE id_frase = ?`,
        [frase, autor || null, id_emocion, id]
      );

      const [updatedFrase] = await pool.query(`
        SELECT f.*, e.nombre_emocion
        FROM Frases f
        JOIN Emocion e ON f.id_emocion = e.id_emocion
        WHERE f.id_frase = ?
      `, [id]);

      res.json(updatedFrase[0]);
    } catch (error) {
      console.error("Error en update:", error);
      res.status(500).json({ message: "Error al actualizar frase" });
    }
  },

  // Eliminar frase
  delete: async (req, res) => {
    try {
      const [result] = await pool.query(
        "DELETE FROM Frases WHERE id_frase = ?",
        [req.params.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Frase no encontrada" });
      }

      res.json({ message: "Frase eliminada correctamente" });
    } catch (error) {
      console.error("Error en delete:", error);
      res.status(500).json({ message: "Error al eliminar frase" });
    }
  },

  // Buscar frases por texto
  search: async (req, res) => {
    const { query } = req.query;

    try {
      const [frases] = await pool.query(`
        SELECT f.*, e.nombre_emocion
        FROM Frases f
        JOIN Emocion e ON f.id_emocion = e.id_emocion
        WHERE f.frase LIKE ? OR f.autor LIKE ?
      `, [`%${query}%`, `%${query}%`]);

      res.json(frases);
    } catch (error) {
      console.error("Error en search:", error);
      res.status(500).json({ message: "Error en búsqueda" });
    }
  }
};