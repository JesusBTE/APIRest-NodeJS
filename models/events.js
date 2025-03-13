// Importamos la configuración de Firebase Admin
const admin = require("../config/config"); // Asegúrate de que la ruta sea correcta

// Accedemos a Firestore
const db = admin.firestore();
module.exports = db;

// Referencia a la colección "Events" en Firestore
const collection = db.collection("Eventos");

class Event {
  // Método para obtener todas los eventos
  static async getAllEvents() {
    const snapshot = await collection.get(); // Obtiene todos los documentos de la colección
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })); // Devuelve un array con los eventos
  }

  // Método para obtener un evento por su ID
  static async getEventById(id) {
    const doc = await collection.doc(id).get(); // Obtiene el documento por ID
    if (!doc.exists) throw new Error("Event not found"); // Si no existe, lanza un error
    return { id: doc.id, ...doc.data() }; // Devuelve el evento con su ID
  }

  // Método para crear una nueva tarea
  static async createEvent(eventData) {
    const docRef = await collection.add(eventData); // Agrega una nuevo evento a la colección
    return { id: docRef.id, ...eventData }; // Devuelve la tarea creada con su nuevo ID
  }

  // Método para actualizar un evento existente
  static async updateEvent(id, updatedData) {
    // Obtener los datos actuales del evento utilizando el ID proporcionado.
    const eventData = await this.getEventById(id); // Obtener los datos actuales del evento

    // Calcular el número total de participantes confirmados en el evento con los nuevos datos.
    // Se filtran los participantes cuyo campo `asistenciaConfirmada` es `true`.
    const participantesConfirmados = (updatedData.participantes || []).filter(
      (p) => p.asistenciaConfirmada
    ).length;

    // Calcular los lugares disponibles después de confirmar la asistencia de los participantes.
    // La disponibilidad de lugares se calcula restando los participantes confirmados de la capacidad máxima del evento.
    const nuevosLugaresDisponibles =
      eventData.capacidadMaxima - participantesConfirmados;

    // Validar que la cantidad de lugares disponibles no sea negativa.
    // Si los lugares disponibles son negativos, significa que la capacidad máxima ha sido superada.
    if (nuevosLugaresDisponibles < 0) {
      return { status: 400, message: "La capacidad máxima ha sido superada" };
      // Si la capacidad máxima es superada, retorna un error con el mensaje adecuado.
    }

    // Actualizar el evento en la base de datos con los nuevos datos y los lugares disponibles recalculados.
    await collection.doc(id).update({
      ...updatedData, // Se mantiene el resto de los datos del evento, solo actualizando los necesarios
      lugaresDisponibles: nuevosLugaresDisponibles, // Actualizamos la disponibilidad de lugares con el nuevo cálculo
    });

    // Devolver el evento actualizado, incluyendo el ID y los nuevos datos.
    return { id, ...updatedData }; // Devuelve el evento actualizado
  }

  // Método para eliminar un evento
  static async deleteEvent(id) {
    await collection.doc(id).delete(); // Elimina el evento por ID
    return { id, message: "Evento elimanado" }; // Mensaje de confirmación
  }

  static async confirmAttendance(req, res) {
    try {
      const { id, email } = req.params;

      // Buscar el evento
      const eventDoc = await collection.doc(id).get();
      if (!eventDoc.exists) {
        return res.status(404).json({ message: "Evento no encontrado" });
      }

      // Obtener la lista de participantes
      const eventData = eventDoc.data();
      const participantes = eventData.participantes || [];

      // Buscar al participante por correo
      const participanteIndex = participantes.findIndex(
        (p) => p.correo === email
      );

      if (participanteIndex === -1) {
        return res.status(404).json({
          message: "Participante no encontrado en este evento",
        });
      }

      // Validar si ya confirmó asistencia
      if (participantes[participanteIndex].asistenciaConfirmada) {
        return res.status(400).json({
          message: "La asistencia ya fue confirmada previamente",
        });
      }

      // Confirmar asistencia
      participantes[participanteIndex].asistenciaConfirmada = true;

      // Actualizar en la base de datos
      await collection.doc(id).update({ participantes });

      return res.status(200).json({
        message: "Asistencia confirmada exitosamente",
        participante: participantes[participanteIndex],
      });
    } catch (error) {
      res.status(401).json({
        message: "Error al confirmar asistencia",
        error: error.message,
      });
    }
  }
}

// Exportamos la clase Event para su uso en el controlador
module.exports = Event;
