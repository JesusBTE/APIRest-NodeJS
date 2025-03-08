// Importamos el modelo Task para interactuar con la base de datos
const Event = require("../models/events");
const admin = require("../config/config");
const db = admin.firestore();
const collection = db.collection("Eventos");

class eventController {
  // Método para obtener todas los eventos
  static async getEvents(req, res) {
    try {
      const events = await Event.getAllEvents(); // Llama al modelo para obtener todas los eventos
      res.json(events); // Devuelve la lista de eventos en formato JSON
    } catch (error) {
      res.status(400).json({
        error: "No se pudieron obtener los eventos",
        error: error.message,
      });
    }
  }

  // Método para obtener un evento específico por su ID
  static async getEventById(req, res) {
    try {
      const event = await Event.getEventById(req.params.id); // Llama al modelo para buscar el evento por ID
      res.json(event); // Si el evento existe, lo devuelve en formato JSON
    } catch (error) {
      res.status(404).json({ error: "Evento no encontrado" }); // Error si el evento no existe
    }
  }

  // Método para crear un nuevo evento
  // Controlador para crear un nuevo evento
  static async createEvent(req, res) {
    try {
      const eventData = req.body; // Los datos enviados en el cuerpo de la solicitud
      if (!eventData.titulo || !eventData.fechaInicio) {
        return res.status(400).json({ message: "Faltan datos requeridos" });
      }

      // Verificar si la capacidad no supera los lugares disponibles
      if (eventData.capacidadMaxima <= eventData.lugaresDisponibles) {
        return res.status(400).json({
          message:
            "Los lugares disponibles no pueden ser mayores que la capacidad máxima",
        });
      }

      // Verifica si el número de participantes excede la capacidad máxima
      if (
        eventData.participantes &&
        eventData.participantes.length > eventData.capacidadMaxima
      ) {
        return res.status(400).json({
          message: `El número de participantes excede la capacidad máxima de ${eventData.capacidadMaxima}`,
        });
      }

      const createdEvent = await Event.createEvent(eventData); // Crear el evento
      res.status(201).json(createdEvent); // Devuelve el evento creado
    } catch (error) {
      console.error("Error al crear el evento:", error);
      res
        .status(400)
        .json({ message: "Error al crear el evento", error: error.message });
    }
  }

  // Método para actualizar un evento existente
  static async updateEvent(req, res) {
    const eventData = req.body; // Datos enviados en la solicitud
    if (eventData.capacidadMaxima <= eventData.lugaresDisponibles) {
      return res.status(400).json({
        message:
          "Los lugares disponibles no pueden ser mayores que la capacidad máxima",
      });
    }

    // Verifica si el número de participantes excede la capacidad máxima
    if (
      eventData.participantes &&
      eventData.participantes.length > eventData.capacidadMaxima
    ) {
      return res.status(400).json({
        message: `El número de participantes excede la capacidad máxima de ${eventData.capacidadMaxima}`,
      });
    }

    try {
      await Event.updateEvent(req.params.id, eventData); // Actualiza el evento con los datos completos
      res.json({
        message: "Evento actualizado correctamente",
        ...eventData, // Devuelve todo el body params actualizado
      });
    } catch (error) {
      res.status(404).json({
        message: "No se pudo actualizar el evento",
        error: error.message,
      });
    }
  }

  // Método para eliminar un evento
  static async deleteEvent(req, res) {
    try {
      await Event.deleteEvent(req.params.id); // Llama al modelo para eliminar el evento por ID
      res.json({ message: "Evento eliminado correctamente" }); // Mensaje de éxito
    } catch (error) {
      res.status(400).json({ error: error.message }); // Manejo de errores internos del servidor
    }
  }

  static async enviarRecordatorio(req, res) {
    try {
      const eventId = req.params.id;
      //console.log(`Buscando evento con ID: ${eventId}`);

      const eventDoc = await collection.doc(eventId).get();
      if (!eventDoc.exists) {
        return res.status(404).json({ message: "Evento no encontrado" });
      }

      const eventData = eventDoc.data();
      const fechaEvento = new Date(eventData.fechaInicio); // Fecha de inicio
      const fechaActual = new Date();

      // Calculamos la diferencia de días entre la fecha actual y la fecha del evento
      const diferenciaDias = Math.floor(
        (fechaEvento - fechaActual) / (1000 * 60 * 60 * 24)
      );

      // Si faltan más de 5 días para el evento, no enviamos recordatorios
      if (diferenciaDias >= 5) {
        return res.status(400).json({
          message:
            "Fecha no óptima para enviar las notificaciones. El evento es dentro de más de 5 días.",
        });
      }

      if (!eventData.participantes || eventData.participantes.length === 0) {
        return res.json({
          message: "No hay participantes para enviar recordatorios",
        });
      }

      const recordatorios = eventData.participantes.map((participante) => ({
        correo: participante.correo,
        mensaje: `Enviando recordatorio a ${participante.correo}: "${
          eventData.titulo
        }" será el ${fechaEvento.toLocaleString()}`,
      }));

      return res.json({
        message: "Recordatorio enviado",
        evento: {
          participantes: recordatorios, // Los correos y mensajes de los participantes
        },
      });
    } catch (error) {
      console.error(`Error al enviar recordatorio: ${error}`);
      return res.status(400).json({
        message: "Error al enviar recordatorio",
        error: error.message,
      });
    }
  }
  static async confirmarAsistencia(req, res) {
    try {
      // Obtener 'id' y 'email' desde los parámetros de la ruta de la solicitud.
      const { id, email } = req.params;

      // Crear una referencia al documento del evento usando el 'id' proporcionado.
      const docRef = collection.doc(id);

      // Obtener los datos del evento de Firestore usando la referencia creada.
      const event = await docRef.get();

      // Verificar si el evento no existe. Si no existe, lanzar un error.
      if (!event.exists) throw new Error("Evento no encontrado");

      // Obtener los datos del evento en formato JSON.
      const eventData = event.data();

      // Si no existen participantes en el evento, inicializar un arreglo vacío.
      const participantes = eventData.participantes || [];

      // Buscar el participante cuyo correo coincida con el proporcionado en los parámetros.
      const participanteIndex = participantes.findIndex(
        (p) => p.correo === email
      );

      // Si no se encuentra al participante en el arreglo, enviar un mensaje de error.
      if (participanteIndex === -1) {
        return res
          .status(404) // Not Found: El participante no fue encontrado en el evento.
          .json({ message: "Participante no encontrado en este evento" });
      }

      // Verificar si el participante ya ha confirmado su asistencia.
      if (participantes[participanteIndex].asistenciaConfirmada) {
        // Si la asistencia ya fue confirmada previamente, enviar un mensaje de error.
        return res
          .status(400) // La asistencia ya ha sido confirmada previamente.
          .json({ message: "La asistencia ya fue confirmada previamente" });
      }

      // Si no se ha confirmado la asistencia previamente, marcar la asistencia como confirmada.
      participantes[participanteIndex].asistenciaConfirmada = true;

      // Actualizar el documento de Firestore con la lista de participantes modificada.
      await docRef.update({ participantes });

      // Responder con un mensaje exitoso y los datos del participante cuya asistencia fue confirmada.
      return res.json({
        message: "Asistencia confirmada exitosamente",
        participante: participantes[participanteIndex],
      });
    } catch (error) {
      // Código de estado 400 para indicar que hay un problema con los datos o la solicitud.
      return res
        .status(400)
        .json({ message: "No se pudo confirmar la asistencia" });
    }
  }
}

// Exportamos la clase para que pueda ser utilizada en las rutas
module.exports = eventController;
