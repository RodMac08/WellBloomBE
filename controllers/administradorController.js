/*
Proyecto: WellBloom
Código para agregar rutas del controlador de administrador
Creado: 15 de abril del 2025
Última actualización: 15 de abril del 2025
Última actualización hecha por: Rodrigo Macias Ruiz
*/

import pool from "../config/db.js";
import { validationResult } from "express-validator";
import { check } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Validaciones
export const adminValidations = [
  check('nombre')
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ max: 255 }).withMessage('Máximo 255 caracteres'),
  check('correo')
    .isEmail().withMessage('Correo electrónico inválido')
    .custom(async (value, { req }) => {
      const [admin] = await pool.query(
        "SELECT id_administrador FROM Administrador WHERE correo = ? AND id_administrador != ?",
        [value, req.params?.id || 0]
      );
      if (admin.length > 0) {
        throw new Error('El correo ya está registrado');
      }
    }),
  check('contrasena')
    .if((value, { req }) => req.method === 'POST' || value)
    .isLength({ min: 8 }).withMessage('Mínimo 8 caracteres'),
  check('rol')
    .optional()
    .isIn(['superadmin', 'moderador', 'editor']).withMessage('Rol no válido')
];

// Controlador de Administradores
export const administradorController = {
  // Registro de nuevo administrador (solo para superadmins)
  register: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nombre, correo, contrasena, rol = 'moderador' } = req.body;

    try {
      // Hashear contraseña
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(contrasena, salt);

      const [result] = await pool.query(
        `INSERT INTO Administrador 
        (nombre, correo, contrasena, rol) 
        VALUES (?, ?, ?, ?)`,
        [nombre, correo, hashedPassword, rol]
      );

      // Omitir contraseña en la respuesta
      const [newAdmin] = await pool.query(
        "SELECT id_administrador, nombre, correo, rol, fecha_creacion FROM Administrador WHERE id_administrador = ?",
        [result.insertId]
      );

      res.status(201).json(newAdmin[0]);
    } catch (error) {
      console.error("Error en register:", error);
      res.status(500).json({ message: "Error al registrar administrador" });
    }
  },

  // Autenticación (Login)
  login: async (req, res) => {
    const { correo, contrasena } = req.body;

    try {
      const [admin] = await pool.query(
        "SELECT * FROM Administrador WHERE correo = ?",
        [correo]
      );

      if (admin.length === 0) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      // Verificar contraseña
      const validPassword = await bcrypt.compare(contrasena, admin[0].contrasena);
      if (!validPassword) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      // Generar token JWT
      const token = jwt.sign(
        {
          id: admin[0].id_administrador,
          rol: admin[0].rol
        }, 
        process.env.JWT_SECRET, 
        { expiresIn: '8h' }
      );

      // Actualizar último acceso
      await pool.query(
        "UPDATE Administrador SET ultimo_acceso = NOW() WHERE id_administrador = ?",
        [admin[0].id_administrador]
      );

      // Datos seguros para el cliente
      const adminData = {
        id: admin[0].id_administrador,
        nombre: admin[0].nombre,
        correo: admin[0].correo,
        rol: admin[0].rol,
        token
      };

      res.json(adminData);
    } catch (error) {
      console.error("Error en login:", error);
      res.status(500).json({ message: "Error en autenticación" });
    }
  },

  // Obtener todos los administradores (sin contraseñas)
  getAll: async (req, res) => {
    try {
      const [admins] = await pool.query(
        "SELECT id_administrador, nombre, correo, rol, fecha_creacion, ultimo_acceso FROM Administrador"
      );
      res.json(admins);
    } catch (error) {
      console.error("Error en getAll:", error);
      res.status(500).json({ message: "Error al obtener administradores" });
    }
  },

  // Obtener administrador por ID
  getById: async (req, res) => {
    try {
      const [admin] = await pool.query(
        `SELECT id_administrador, nombre, correo, rol, 
        fecha_creacion, ultimo_acceso 
        FROM Administrador WHERE id_administrador = ?`,
        [req.params.id]
      );

      if (admin.length === 0) {
        return res.status(404).json({ message: "Administrador no encontrado" });
      }

      res.json(admin[0]);
    } catch (error) {
      console.error("Error en getById:", error);
      res.status(500).json({ message: "Error al obtener administrador" });
    }
  },

  // Actualizar administrador
  update: async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { nombre, correo, contrasena, rol } = req.body;

    try {
      let updateQuery = "UPDATE Administrador SET nombre = ?, correo = ?";
      const params = [nombre, correo];

      // Actualizar contraseña solo si se proporciona
      if (contrasena) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(contrasena, salt);
        updateQuery += ", contrasena = ?";
        params.push(hashedPassword);
      }

      // Actualizar rol si se proporciona
      if (rol) {
        updateQuery += ", rol = ?";
        params.push(rol);
      }

      updateQuery += " WHERE id_administrador = ?";
      params.push(id);

      await pool.query(updateQuery, params);

      // Obtener administrador actualizado
      const [updatedAdmin] = await pool.query(
        `SELECT id_administrador, nombre, correo, rol, 
        fecha_creacion, ultimo_acceso 
        FROM Administrador WHERE id_administrador = ?`,
        [id]
      );

      res.json(updatedAdmin[0]);
    } catch (error) {
      console.error("Error en update:", error);
      res.status(500).json({ message: "Error al actualizar administrador" });
    }
  },

  // Eliminar administrador (con restricciones)
  delete: async (req, res) => {
    const { id } = req.params;

    try {
      // Verificar que no sea el último superadmin
      const [superadmins] = await pool.query(
        "SELECT id_administrador FROM Administrador WHERE rol = 'superadmin'"
      );

      const [targetAdmin] = await pool.query(
        "SELECT rol FROM Administrador WHERE id_administrador = ?",
        [id]
      );

      if (targetAdmin.length === 0) {
        return res.status(404).json({ message: "Administrador no encontrado" });
      }

      if (targetAdmin[0].rol === 'superadmin' && superadmins.length <= 1) {
        return res.status(400).json({ 
          message: "No se puede eliminar al único superadmin" 
        });
      }

      // Verificar reportes asignados
      const [reportes] = await pool.query(
        "SELECT id_reporte FROM Reporte WHERE id_administrador = ? LIMIT 1",
        [id]
      );

      if (reportes.length > 0) {
        return res.status(400).json({ 
          message: "Reasigne los reportes antes de eliminar este administrador" 
        });
      }

      const [result] = await pool.query(
        "DELETE FROM Administrador WHERE id_administrador = ?",
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Administrador no encontrado" });
      }

      res.json({ message: "Administrador eliminado correctamente" });
    } catch (error) {
      console.error("Error en delete:", error);
      res.status(500).json({ message: "Error al eliminar administrador" });
    }
  },

  // Middleware de verificación de token
  verifyToken: (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: "Acceso no autorizado" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.admin = decoded;
      next();
    } catch (error) {
      res.status(401).json({ message: "Token inválido" });
    }
  },

  // Middleware de verificación de rol
  checkRole: (roles) => {
    return (req, res, next) => {
      if (!roles.includes(req.admin.rol)) {
        return res.status(403).json({ 
          message: "No tienes permisos para esta acción" 
        });
      }
      next();
    };
  }
};