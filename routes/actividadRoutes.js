/*
Proyecto: WellBloom
Código para agregar rutas del controlador de actividades
Creado: 14 de abril del 2025
Última actualización: 14 de abril del 2025
Última actualización hecha por: Rodrigo Macias Ruiz
*/

import { Router } from "express";
import { actividadController, actividadValidations } from "../controllers/actividadController.js";
import { check } from "express-validator";

const router = Router();

router.get("/", actividadController.getAll);
router.post("/", actividadValidations, actividadController.create);
router.get("/:id", actividadController.getById);
router.put("/:id", actividadValidations, actividadController.update);
router.delete("/:id", actividadController.delete);
router.get("/search", actividadController.search);

export default router;