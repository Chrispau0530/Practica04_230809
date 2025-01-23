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
    const { sessionId } = req.body;
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




// Ruta para obtener el estado de la sesión
app.get('/status', (req, res) => {
    const sessionID = req.query.sessionID;
    const now = new Date();
    const started = new Date(req.session.createdAt);
    const lastUpdate = new Date(req.session.lastAccess);

    // Calcular la antigüedad de la sesión
    const sessionAgeMS = now - started;
    const hours = Math.floor(sessionAgeMS / (1000 * 60 * 60));  // Cambié 100*60*60 por 1000*60*60
    const minutes = Math.floor((sessionAgeMS % (1000 * 60 * 60)) / (1000 * 60));  // Lo mismo para minutos
    const seconds = Math.floor((sessionAgeMS % (1000 * 60)) / 1000);  // Y para segundos

    const createAD_CDMX = moment(started).tz('America/Mexico_City').format('YYYY-MM-DD HH:mm:ss');  // Corregí el nombre de la zona horaria 'America/Mexico_City' y formato 'YYYY-MM-DD'
    const lastAccess = moment(lastUpdate).tz('America/Mexico_City').format('YYYY-MM-DD HH:mm:ss');  // Corregí el formato de la fecha

    if (!sessionID || !req.session) {  // Cambié sessionId por sessionID y la validación de la sesión
        return res.status(404).json({
            message: "No hay una sesión activa"
        });
    }

    res.status(200).json({
        message: 'Estado de la sesión',
        sessionID: req.sessionID,  // Asegúrate de usar req.sessionID en lugar de req.query.sessionID
        inicio: createAD_CDMX,
        ultimoAcceso: lastAccess,
        antigüedad: `${hours} horas, ${minutes} minutos y ${seconds} segundos`
    });
});

