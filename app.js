import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment-timezone';
import os from 'os';

const app = express();
const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Servidor iniciado en http://localhost:${PORT}`);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Almacenamiento en memoria para sesiones
const sessions = {};

app.use(
    session({
        secret: "CPRP-SesionesHTTP-VariablesDeSesion",
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 5 * 60 * 1000 },
    })
);

app.get('/', (req, res) => {
    return res.status(200).json({
        message: "Bienvenid@ al API de Control de Sesiones",
        author: "Christian Paul Rodriguez Perez",
    });
});

const getLocalIp = () => {
    const networkInterfaces = os.networkInterfaces();
    for (const interfaceName in networkInterfaces) {
        const interfaces = networkInterfaces[interfaceName];
        for (const iface of interfaces) {
            if (iface.family === "IPv4" && !iface.internal) {
                return iface.address;
            }
        }
    }
    return null;
};

app.post('/login', (req, res) => {
    const { email, nickname, macAddress } = req.body;
    if (!email || !nickname || !macAddress) {
        return res.status(400).json({ message: "Se esperan campos requeridos" });
    }

    const sessionId = uuidv4();
    const now = new Date();
    const started = new Date(req.session.createdAt);
    const lastUpdate = new Date(req.session.lastAccess);
    
    const lastAccess = moment(lastUpdate).tz('America/Mexico_City').format('YYYY-MM-DD HH:mm:ss');  // Corregí el formato de la fecha
    const createAD_CDMX = moment(started).tz('America/Mexico_City').format('YYYY-MM-DD HH:mm:ss');

    sessions[sessionId] = {
        sessionId,
        email,
        nickname,
        macAddress,
        ip: getLocalIp(),
        createAD_CDMX: now,
        lastAccess:now,
    };

    res.status(200).json({
        message: "Se ha logeado de manera exitosa",
        sessionId,
        email,
        nickname,
        macAddress,
        createAD_CDMX:now,
        lastAccess:now,

    });
});

app.post("/logout", (req, res) => {
    const { sessionId} = req.body;
    if (!sessionId || !sessions[sessionId]) {
        return res.status(404).json({ message: "No se ha encontrado una sesión activa" });
    }
    delete sessions[sessionId];
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Error al cerrar sesión');
        }
    });
    res.status(200).json({ message: "Logout successful" });
});

app.post("/update", (req, res) => {
    const { sessionId, email, nickname } = req.body;

    if (!sessionId || !sessions[sessionId]) {
        return res.status(404).json({ message: "No existe una sesión activa" });
    }
    if (email) sessions[sessionId].email = email;
    if (nickname) sessions[sessionId].nickname = nickname;
    sessions[sessionId].lastAccess = new Date();

    res.status(200).json({
        message: "Sesión actualizada correctamente",
        session: sessions[sessionId],
    });
});



app.get('/status', (req, res) => {
    const { sessionID } = req.query;  // Obtiene el sessionID desde los parámetros de consulta
    const now = new Date();

    // Asegúrate de que la sesión exista
    if (!sessionID || !req.session || !sessions[sessionID]) {
        return res.status(404).json({
            message: "No hay una sesión activa"
        });
    }

    // Recupera la fecha de creación y el último acceso de la sesión
    const started = new Date(sessions[sessionID]?.createAD_CDMX);
    const lastUpdate = new Date(sessions[sessionID]?.lastAccess);
    const nickname = (sessions[sessionID]?.nickname)
    const email = (sessions[sessionID]?.email)
    const ip_solicitud =(sessions[sessionID]?.ip)

    // Verifica que las fechas sean válidas
    if (isNaN(started.getTime()) || isNaN(lastUpdate.getTime())) {
        return res.status(400).json({
            message: "Las fechas de la sesión no son válidas"
        });
    }

    // Calcular la antigüedad de la sesión
    const sessionAgeMS = now - started;
    const hours = Math.floor(sessionAgeMS / (1000 * 60 * 60));
    const minutes = Math.floor((sessionAgeMS % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((sessionAgeMS % (1000 * 60)) / 1000);

    const createAD_CDMX = moment(started).tz('America/Mexico_City').format('YYYY-MM-DD HH:mm:ss');
    const lastAccess = moment(lastUpdate).tz('America/Mexico_City').format('YYYY-MM-DD HH:mm:ss');

    res.status(200).json({
        message: 'Estado de la sesión',
        nickname:nickname,
        sessionID: sessionID,
        email:email,
        ip_solictud:ip_solicitud,
        ip_responde:getLocalIp(),
        inicio: createAD_CDMX,
        ultimoAcceso: lastAccess,
        antigüedad: `${hours} horas, ${minutes} minutos y ${seconds} segundos`
    });
});

// Supongamos que sessions es un objeto donde se almacenan las sesiones
//const sessions = {}; // Asegúrate de inicializarlo con datos válidos

app.get('/listCurrentSession', (req, res) => {
  const { sessionID } = req.query; // Obtiene el ID de sesión desde los parámetros de consulta
  const now = new Date();

  // Verifica si la sesión existe
  if (!sessionID || !sessions[sessionID]) {
    return res.status(404).json({ message: "No hay una sesión activa" });
  }

  const sessionData = sessions[sessionID];

  // Recupera los datos de la sesión
  const started = new Date(sessionData.createAD_CDMX);
  const lastUpdate = new Date(sessionData.lastAccess);
  const nickname = sessionData.nickname || "Desconocido";
  const email = sessionData.email || "No proporcionado";
  const ipSolicitud = sessionData.ip || "No registrada";

  // Verifica que las fechas sean válidas
  if (isNaN(started.getTime()) || isNaN(lastUpdate.getTime())) {
    return res.status(400).json({ message: "Las fechas de la sesión no son válidas" });
  }

  // Calcular la antigüedad de la sesión
  const sessionAgeMS = now - started;
  const hours = Math.floor(sessionAgeMS / (1000 * 60 * 60));
  const minutes = Math.floor((sessionAgeMS % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((sessionAgeMS % (1000 * 60)) / 1000);

  const createAD_CDMX = moment(started).tz('America/Mexico_City').format('YYYY-MM-DD HH:mm:ss');
  const lastAccess = moment(lastUpdate).tz('America/Mexico_City').format('YYYY-MM-DD HH:mm:ss');

  // Respuesta con el estado de la sesión
  res.status(200).json({
    message: 'Estado de la sesión',
    nickname: nickname,
    sessionID: sessionID,
    email: email,
    ipSolicitud: ipSolicitud,
    ipRespuesta: getLocalIp(), // Implementa esta función según tu entorno
    inicio: createAD_CDMX,
    ultimoAcceso: lastAccess,
    antigüedad: `${hours} horas, ${minutes} minutos y ${seconds} segundos`
  });
});