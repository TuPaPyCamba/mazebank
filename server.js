import express from 'express'
import mongoose from 'mongoose'
import { config } from './config.js'

const server = express()

// Middlewares
server.use(express.json())

// conexion a Mongo
mongoose
