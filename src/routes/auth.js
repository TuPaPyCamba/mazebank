import express from 'express';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import config from '../config.js';
import 'colors';
import checkAuth from '../middlewares/checkAuth.js';
const router = express.Router();

// Ruta para registrarse
router.post('/register', async (req, res) => {
    const { userName, name, surnames: { paternal, maternal }, email, phoneNumber, birthdate, placeOfBirth: { city, state, country }, address, rfc, occupation, password, passwordConfirm } = req.body;

    try {
        // Validaciones
        Validation.name(name);
        Validation.password(password);
        Validation.email(email);

        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            const errorMessage = "user already exists";
            console.log(
                `SERVER:`.green +
                ` Error when trying to create a new User, with the following data \n Name: ${name} \n Email: ${email} \n Password: ***** \n ` +
                `ESTATUS: (400) `.red +
                `${errorMessage} \n`
            );
            return res.status(400).send({ error: errorMessage });
        }

        // Crear el nuevo usuario
        const newUser = new User({ userName, name, surnames: { paternal, maternal }, email, phoneNumber, birthdate, placeOfBirth: { city, state, country }, address, rfc, occupation, password, passwordConfirm });
        await newUser.save();

        res.status(201).json({ message: 'Usuario registrado exitosamente' });
        console.log(
            `SERVER:`.green +
            ` New user created \n ID: ${newUser._id} \n Name: ${name} \n Email: ${email} \n Password: ***** \n`
        );

    } catch (error) {
        res.status(500).json({ message: 'Error en el registro', error });
        console.log(
            `SERVER:`.green +
            ` Error when trying to create a new User, with the following data \n Name: ${name} \n Email: ${email} \n Password: ***** \n ` +
            `ESTATUS: (500) `.red +
            `${error} \n`
        );
    }
})

// Ruta para iniciar sesión
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        Validation.email(email);
        Validation.password(password);

        const user = await User.findOne({ email });

        if (!user) {
            const errorMessage = "username does not exist";
            console.log(
                `SERVER:`.green +
                ` Error when trying to login into an account, with the following data \n Email: ${email} \n Password: ***** \n ` +
                `ESTATUS: (401)`.red +
                ` ${errorMessage} \n`
            );
            return res.status(400).send({ error: errorMessage });
        }

        const isMatch = await user.comparePassword(password)

        if (!isMatch) {
            const errorMessage = "password is invalid";
            console.log(
                `SERVER:`.green +
                ` Error when trying to login into an account, with the following data \n Email: ${email} \n Password: ***** \n ` +
                `ESTATUS: (401)`.red +
                ` ${errorMessage} \n`
            );
            return res.status(400).send({ error: errorMessage });
        }

        // Crea el token
        const token = jwt.sign(
            {
                id: user._id,
            }, config.JWT_SECRET, { expiresIn: '1h' });

        // Configura la cookie con HttpOnly y Secure
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // usa Secure en producción
            maxAge: 3600000, // Expira en 1 hora
            sameSite: "Strict" // protege contra CSRF
        })

        // Envía solo la respuesta de éxito sin el token en el cuerpo
        res.json({ message: "Inicio de sesión exitoso" });

        console.log(
            `SERVER:`.green +
            ` A new session has been started, the session started is \n Email: ${email} \n Password: ***** \n `
        )

    } catch (error) {
        res
            .status(500)
            .send({ error: "Error en el servidor", details: error.message });
        console.log(
            `SERVER:`.green +
            ` Error when trying to login into an account, with the following data \n Email: ${email} \n Password: ***** \n ` +
            `ESTATUS: (401)`.red +
            ` ${error.message} \n`
        );
    }
})

// Middleware para verificar la autenticación
router.get('/check', checkAuth, (req, res) => {
    res.status(200).json({
        message: 'User is authenticated',
        user: req.user, // Aquí podrías enviar datos del usuario, si es necesario
    })
})

// Ruta para cerra sesión
router.post("/logout", (req, res) => {
    res.clearCookie("token"); // elimina la cookie del token
    res.json({ message: "Sesión cerrada" });
})

// Validación de campos
class Validation {
    static name(name) {
        if (typeof name !== "string")
            throw new Error("name must be a string");
        if (name.length < 5)
            throw new Error("name must be at least 5 characters long");
    }

    static password(password) {
        if (typeof password !== "string")
            throw new Error("password must be a string");
        if (password.length < 8)
            throw new Error("password must be at least 8 characters long");
    }

    static email(email) {
        if (typeof email !== "string")
            throw new Error("email must be a string");
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email))
            throw new Error("email is not valid");
    }
}

export default router