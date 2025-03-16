/*
Proyecto: WellBloom
Código para agregar rutas del controlador de usuarios
Creado: 09 de marzo del 2025
Última actualización: 09 de marzo del 2025
Última actualización hecha por: Rodrigo Macias Ruiz
*/
import { Router } from "express";
import { registroEmocionController } from "../controllers/registroEmocionController.js";
import { check } from "express-validator";

const router = Router();

// Validaciones
const createValidations = [
  check("id_usuario").isInt().withMessage("ID de usuario inválido"),
  check("id_emocion").isInt().withMessage("ID de emoción inválido")
];

// Endpoints
router.get("/", registroEmocionController.getAllRegistros);
router.post("/", createValidations, registroEmocionController.createRegistro);
router.get("/usuario/:id", registroEmocionController.getRegistrosByUsuario);
router.get("/estadisticas/:id", registroEmocionController.getEstadisticasUsuario);
router.delete("/:id", registroEmocionController.deleteRegistro);

export default router;