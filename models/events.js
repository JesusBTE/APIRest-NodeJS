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
    await collection.doc(id).update(updatedData); // Actualiza el documento con el ID proporcionado
    return { id, ...updatedData }; // Devuelve la tarea actualizada
  }

  // Método para eliminar un evento
  static async deleteEvent(id) {
    await collection.doc(id).delete(); // Elimina el evento por ID
    return { id, message: "Event deleted" }; // Mensaje de confirmación
  }

  static async enviarRecordatorio(eventId) {
    try {
      const docRef = collection.doc(eventId);
      const event = await docRef.get();

      if (!event.exists) throw new Error("Evento no encontrado");

      const eventData = event.data();
      if (!eventData.participantes || eventData.participantes.length === 0) {
        throw new Error("No hay participantes inscritos en este evento");
      }

      // Simulación de envío de recordatorios (aquí podrías usar nodemailer o Firebase Cloud Messaging)
      eventData.participantes.forEach((participante) => {
        console.log(`Enviando recordatorio a: ${participante.correo}`);
      });

      return { message: "Recordatorios enviados correctamente" };
    } catch (error) {
      throw new Error("Error al enviar recordatorios: " + error.message);
    }
  }
}

// Exportamos la clase Event para su uso en el controlador
module.exports = Event;
