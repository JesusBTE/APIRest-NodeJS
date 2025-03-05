// Importamos Express para crear el servidor
const express = require("express");
const app = express();

// Importamos las rutas de eventos
const eventRoutes = require("./routes/eventRoutes");

// Middleware para parsear JSON en las solicitudes
app.use(express.json());

// Definimos la ruta base para la API de eventos
app.use("/apiV1/events", eventRoutes);

// Definimos el puerto en el que se ejecutará el servidor
const PORT = process.env.PORT || 3000;

// Iniciamos el servidor y mostramos un mensaje en la consola
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
