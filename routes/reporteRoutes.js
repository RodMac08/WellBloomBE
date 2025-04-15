/*
Proyecto: WellBloom
Código para agregar rutas del controlador de reporte
Creado: 15 de abril del 2025
Última actualización: 15 de abril del 2025
Última actualización hecha por: Rodrigo Macias Ruiz
*/

import { Router } from "express";
import { reporteController, reporteValidations } from "../controllers/reporteController.js";

const router = Router();

router.post("/", reporteValidations, reporteController.create);
router.get("/", reporteController.getAll);
router.get("/:id", reporteController.getById);
router.put("/:id/respuesta", reporteValidations, reporteController.updateRespuesta);
router.delete("/:id", reporteController.delete);
router.get("/estadisticas/totales", reporteController.getEstadisticas);

export default router;