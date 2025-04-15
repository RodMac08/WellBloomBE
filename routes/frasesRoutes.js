/*
Proyecto: WellBloom
Código para agregar rutas del controlador de frases
Creado: 15 de abril del 2025
Última actualización: 15 de abril del 2025
Última actualización hecha por: Rodrigo Macias Ruiz
*/

import { Router } from "express";
import { frasesController, frasesValidations } from "../controllers/frasesController.js";

const router = Router();

router.get("/", frasesController.getAll);
router.post("/", frasesValidations, frasesController.create);
router.get("/emocion/:id", frasesController.getByEmocion);
router.get("/random/emocion/:id", frasesController.getRandomByEmocion);
router.put("/:id", frasesValidations, frasesController.update);
router.delete("/:id", frasesController.delete);
router.get("/search", frasesController.search);

export default router;