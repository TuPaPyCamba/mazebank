import authRoutes from './routes/auth.js'
import transactionRoutes from './routes/transactions.js'
import userRoutes from './routes/user.js'
import updateRoutes from './routes/update.js'
import os from 'os';

import express from "express";
import MongoStore from "connect-mongo";
import mongoose from "mongoose";
import session from "express-session";
import config from "./config.js";
import 'colors'
import bodyParser from 'body-parser';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import xss from 'xss-clean'
import cors from 'cors'
import cookieParser from 'cookie-parser';

const server = express();

server.use(cors({
    origin:`${config.LISTEN}`,
    methods: 'GET, POST, PUT, DELETE',
    credentials: true
}))

const limiter = rateLimit({
    windowMs: 15*60*1000,
    max: 100
})

server.use(cookieParser())

server.use(helmet())

server.use(limiter)

server.use(xss())

// Middlewares
server.use(bodyParser.json())

// conexion a Mongo
mongoose.connect(config.MONGO_URI).then(() => {
    console.log(
        "SERVER:".green +
        ` Successful connection to ` +
        `MONGOOSE`.yellow +
        ` database \n`
    )
}).catch((err) => console.error("SERVER:".green + ` Error de conexión: ` + `${err}`.red))

// Rutas de autenticación (Middleware)
server.use('/api/auth', authRoutes)

// Rutas de recuperacion de datos de Usuario (Middleware)
server.use('/api/user', userRoutes)

// Rutas de Actualizacion de Registros
server.use('/api/update', updateRoutes)

// Rutas de transacciones (Middleware)
server.use('/api/transactions', transactionRoutes)

// Configuración de sesiones
server.use(session({
    secret: config.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: config.MONGO_URI,
        collectionName: 'sessions',
    }),
    cookie: {
        maxAge: 180 * 60 * 1000 // Tiempo de vida de la cookie (180 minutos)
    }
}));

// Iniciar el servidor
server.listen(config.PORT, '0.0.0.0', () => {
    console.log(
        `\nSERVER: `.green +
        `Authentication services running correctly on the following port \n \n service route:  ` +
        `http://localhost:${config.PORT} \n`.blue + 
        ` Accesible en red local en: `+ `http://${getLocalIP()}:${config.PORT} \n`.blue
    );
});

// Función para obtener la IP local
function getLocalIP() {
    const networkInterfaces = os.networkInterfaces();
    for (const interfaceName in networkInterfaces) {
        for (const iface of networkInterfaces[interfaceName]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address; // Retorna la IP local
            }
        }
    }
    return 'localhost'; // Fallback si no se encuentra una IP
}