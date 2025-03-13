// Importamos Express y creamos un router
const express = require("express");
const router = express.Router();

// Importamos el controlador de eventos
const eventController = require("../controllers/eventController");

// Definimos las rutas para gestionar las eventos

// Obtener todas las eventos
router.get("/", eventController.getEvents);

// Obtener una evento por su ID
router.get("/:id", eventController.getEventById);

// Crear una nueva evento
router.post("/", eventController.createEvent);

// Actualizar una evento por su ID
router.put("/:id", eventController.updateEvent);

// Eliminar una evento por su ID
router.delete("/:id", eventController.deleteEvent);

router.post("/:id/recordatorio", eventController.notification);

router.patch("/:id/confirmar/:email", eventController.confirmAttendance);

// Exportamos el router para que pueda ser utilizado en la aplicación principal
module.exports = router;
