#!/usr/bin/env node
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import moradoresRoutes from './routes/moradores.js'
import encomendasRoutes from './routes/encomendas.js'

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/moradores', moradoresRoutes);
app.use('/api/encomendas', encomendasRoutes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, '0.0.0.0', () => {
	console.log(`server rodando em http://0.0.0.0:${PORT}`);
})
