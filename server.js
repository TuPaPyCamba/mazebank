import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactions.js'

import express from "express";
import MongoStore from "connect-mongo";
import mongoose from "mongoose";
import session from "express-session";
import { config } from "./config.js";
import 'colors'
import bodyParser from 'body-parser';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import xss from 'xss-clean'

const server = express();

server.use(helmet())

const limiter = rateLimit({
    windowMs: 15*60*1000,
    max: 100
})

server.use(limiter)

server.use(xss())

// Middlewares
server.use(bodyParser.json());

// Rutas de autenticación (Middleware)
server.use('/api/auth', authRoutes);

// Rutas de transacciones (Middleware)
server.use('/api/transactions', transactionRoutes);

// conexion a Mongo
mongoose.connect(config.MONGO_URI).then(() => {
    console.log(
        "SERVER:".green +
        ` Successful connection to ` +
        `MONGOOSE`.yellow +
        ` database \n`
    )
}).catch((err) => console.error("SERVER:".green + ` Error de conexión:` + `${err}`.red))

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
server.listen(config.PORT, () => {
    console.log(
        `SERVER: `.green +
        `Authentication services running correctly on the following port \n \n service route:  ` +
        `http://localhost:${config.PORT} \n`.blue
    );
});