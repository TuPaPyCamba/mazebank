import express from 'express';
import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import 'colors';

const router = express.Router();

// Ruta para registrarse
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        Validation.name(name);
        Validation.password(password);
        Validation.email(email);

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

        const newUser = new User({ name, email, password });
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
});

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
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            const errorMessage = "password is invalid";
            console.log(
                `SERVER:`.green +
                ` Error when trying to login into an account, with the following data \n Name: ${user.name} \n Password: ***** \n ` +
                `ESTATUS: (401)`.red +
                ` ${errorMessage} \n`
            );
            return res.status(400).send({ error: errorMessage });
        }
        const token = jwt.sign({ id: user._id }, config.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
        console.log(
            `SERVER:`.green +
            ` A new session has been started, the session started is \n Name: ${user.name} \n`
        );
    } catch (error) {
        res
            .status(500)
            .send({ error: "Error en el servidor", details: error.message });
        console.log(
            `SERVER:`.green +
            ` Error when trying to login into an account, with the following data \n Name: ${user.name} \n Password: ***** \n ` +
            `ESTATUS: (401)`.red +
            ` ${error.message} \n`
        );
    }
});

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

export default router;