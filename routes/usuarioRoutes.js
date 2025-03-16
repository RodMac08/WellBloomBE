/*
Proyecto: WellBloom
Código para agregar rutas del controlador de usuarios
Creado: 09 de marzo del 2025
Última actualización: 09 de marzo del 2025
Última actualización hecha por: Rodrigo Macias Ruiz
*/
import { usuarioController } from "../controllers/usuarioController.js";
import { check } from "express-validator";

const router = Router();

router.get("/", usuarioController.getAllUsuarios);
router.get("/:id", usuarioController.getUsuarioById);
router.post("/", usuarioController.createUsuario);
router.put("/:id/ultimo-ingreso", usuarioController.updateUltimoIngreso);
router.put("/:id/seccion", usuarioController.updateSeccionUsuario);

export default router;