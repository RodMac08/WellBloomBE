/*
Proyecto: WellBloom
Código del controlador de los usarios con operaciones CRUD
Creado: 09 de marzo del 2025
Última actualización: 09 de marzo del 2025
Última actualización hecha por: Rodrigo Macias Ruiz
*/
import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import { validationResult } from "express-validator";

// Helper para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Controlador de Usuarios
export const usuarioController = {
  // Obtener todos los usuarios (sin contraseñas)
  getAllUsuarios: async (req, res) => {
    try {
      const [usuarios] = await pool.query(
        "SELECT id_usuario, nombre, correo, fecha_creacion, fecha_ultimo_ingreso, seccion FROM Usuarios"
      );
      res.json(usuarios);
    } catch (error) {
      console.error("Error en getAllUsuarios:", error);
      res.status(500).json({ message: "Error al obtener los usuarios" });
    }
  },

  // Obtener usuario por ID
  getUsuarioById: async (req, res) => {
    try {
      const [usuario] = await pool.query(
        `SELECT id_usuario, nombre, correo, fecha_creacion, 
        fecha_ultimo_ingreso, seccion 
        FROM Usuarios WHERE id_usuario = ?`,
        [req.params.id]
      );

      if (usuario.length === 0) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      res.json(usuario[0]);
    } catch (error) {
      console.error("Error en getUsuarioById:", error);
      res.status(500).json({ message: "Error al obtener el usuario" });
    }
  },

  // Crear nuevo usuario (con hash de contraseña)
  createUsuario: [
    // Middleware de validación
    check("nombre").notEmpty().withMessage("El nombre es obligatorio"),
    check("correo").isEmail().withMessage("Correo electrónico inválido"),
    check("contrasena")
      .isLength({ min: 8 })
      .withMessage("La contraseña debe tener al menos 8 caracteres"),
    
    async (req, res) => {
      handleValidationErrors(req, res, async () => {
        const { nombre, correo, contrasena, seccion } = req.body;

        try {
          // Verificar si el correo ya existe
          const [existingUser] = await pool.query(
            "SELECT correo FROM Usuarios WHERE correo = ?",
            [correo]
          );

          if (existingUser.length > 0) {
            return res.status(409).json({ message: "El correo ya está registrado" });
          }

          // Hash de la contraseña
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(contrasena, salt);

          // Crear usuario
          const [result] = await pool.query(
            `INSERT INTO Usuarios 
            (nombre, correo, contrasena, seccion) 
            VALUES (?, ?, ?, ?)`,
            [nombre, correo, hashedPassword, seccion]
          );

          // Obtener usuario creado (sin contraseña)
          const [newUser] = await pool.query(
            `SELECT id_usuario, nombre, correo, fecha_creacion, seccion 
            FROM Usuarios WHERE id_usuario = ?`,
            [result.insertId]
          );

          res.status(201).json(newUser[0]);
        } catch (error) {
          console.error("Error en createUsuario:", error);
          res.status(500).json({ message: "Error al crear el usuario" });
        }
      });
    }
  ],

  // Actualizar último ingreso
  updateUltimoIngreso: async (req, res) => {
    try {
      await pool.query(
        "UPDATE Usuarios SET fecha_ultimo_ingreso = CURDATE() WHERE id_usuario = ?",
        [req.params.id]
      );
      
      res.json({ 
        message: "Fecha de último ingreso actualizada correctamente",
        fecha_actualizada: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error("Error en updateUltimoIngreso:", error);
      res.status(500).json({ message: "Error al actualizar el último ingreso" });
    }
  },

  // Actualizar sección del usuario
  updateSeccionUsuario: [
    check("seccion")
      .notEmpty()
      .withMessage("La sección no puede estar vacía"),
    
    async (req, res) => {
      handleValidationErrors(req, res, async () => {
        try {
          await pool.query(
            "UPDATE Usuarios SET seccion = ? WHERE id_usuario = ?",
            [req.body.seccion, req.params.id]
          );
          
          res.json({ message: "Sección actualizada correctamente" });
        } catch (error) {
          console.error("Error en updateSeccionUsuario:", error);
          res.status(500).json({ message: "Error al actualizar la sección" });
        }
      });
    }
  ]
};