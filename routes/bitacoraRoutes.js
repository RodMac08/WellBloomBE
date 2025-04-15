/*
Proyecto: WellBloom
Código para agregar rutas del controlador de bitacora
Creado: 15 de abril del 2025
Última actualización: 15 de abril del 2025
Última actualización hecha por: Rodrigo Macias Ruiz
*/

import { Router } from "express";
import { bitacoraController, bitacoraValidations } from "../controllers/bitacoraController.js";

const router = Router();

router.post("/", bitacoraValidations, bitacoraController.create);
router.get("/usuario/:id", bitacoraController.getByUsuario);
router.get("/:id", bitacoraController.getById);
router.put("/:id/nota", bitacoraValidations, bitacoraController.updateNota);
router.delete("/:id", bitacoraController.delete);
router.get("/resumen/usuario/:id", bitacoraController.getResumenEmocional);

export default router;