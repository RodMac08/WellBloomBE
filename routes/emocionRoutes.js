/*
Proyecto: WellBloom
Código para agregar rutas del controlador de emociones
Creado: 14 de abril del 2025
Última actualización: 14 de abril del 2025
Última actualización hecha por: Rodrigo Macias Ruiz
*/

import { Router } from "express";
import { emocionController, emocionValidations } from "../controllers/emocionController.js";

const router = Router();

router.get("/", emocionController.getAll);
router.get("/:id", emocionController.getById);
router.post("/", emocionValidations, emocionController.create);
router.put("/:id", emocionValidations, emocionController.update);
router.delete("/:id", emocionController.delete);
router.get("/:id/frases", emocionController.getFrases);

export default router;