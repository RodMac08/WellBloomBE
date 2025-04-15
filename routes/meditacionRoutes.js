/*
Proyecto: WellBloom
Código para agregar rutas del controlador de meditación
Creado: 15 de abril del 2025
Última actualización: 15 de abril del 2025
Última actualización hecha por: Rodrigo Macias Ruiz
*/

import { Router } from "express";
import { meditacionController, meditacionValidations } from "../controllers/meditacionController.js";

const router = Router();

router.post("/", meditacionValidations, meditacionController.create);
router.get("/:id", meditacionController.getById);
router.get("/actividad/:id", meditacionController.getByActividad);
router.put("/:id", meditacionValidations, meditacionController.update);
router.put("/:id/complete", meditacionController.complete);
router.delete("/:id", meditacionController.delete);
router.get("/completadas/list", meditacionController.getCompleted);

export default router;