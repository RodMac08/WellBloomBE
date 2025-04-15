/*
Proyecto: WellBloom
Código para agregar rutas del controlador de administrador
Creado: 15 de abril del 2025
Última actualización: 15 de abril del 2025
Última actualización hecha por: Rodrigo Macias Ruiz
*/

import { Router } from "express";
import { administradorController, adminValidations } from "../controllers/administradorController.js";

const router = Router();

// Rutas públicas
router.post("/register", adminValidations, administradorController.register);
router.post("/login", administradorController.login);

// Rutas protegidas (requieren autenticación)
router.get("/", 
  administradorController.verifyToken,
  administradorController.checkRole(['superadmin']),
  administradorController.getAll
);

router.get("/:id", 
  administradorController.verifyToken,
  administradorController.checkRole(['superadmin']),
  administradorController.getById
);

router.put("/:id", 
  administradorController.verifyToken,
  adminValidations,
  administradorController.update
);

router.delete("/:id", 
  administradorController.verifyToken,
  administradorController.checkRole(['superadmin']),
  administradorController.delete
);

export default router;