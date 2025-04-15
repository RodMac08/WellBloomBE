/*
Proyecto: WellBloom
Código para agregar rutas del controlador de ejercicios
Creado: 15 de abril del 2025
Última actualización: 15 de abril del 2025
Última actualización hecha por: Rodrigo Macias Ruiz
*/

import { Router } from "express";
import { ejercicioController, ejercicioValidations } from "../controllers/ejercicioController.js";

const router = Router();

router.post("/", ejercicioValidations, ejercicioController.create);
router.get("/actividad/:id", ejercicioController.getByActividad);
router.put("/:id", ejercicioValidations, ejercicioController.update);
router.put("/:id/complete", ejercicioController.complete);
router.delete("/:id", ejercicioController.delete);
router.get("/turno/:turno", ejercicioController.getByTurno);

export default router;