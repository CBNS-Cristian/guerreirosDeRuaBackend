require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const animalRoutes = require('./routes/animalRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Middlewares
app.use(cors({
    origin: [
        'http://10.0.0.132:8080',
        'http://localhost:5500',
        'http://localhost:27752',
        'https://cbns-cristian.github.io'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
    optionsSuccessStatus: 200
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/animais', animalRoutes);
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'online',
        timestamp: new Date().toISOString() 
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('[ERRO]', err.stack);
    
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'Arquivo muito grande. Tamanho máximo: 5MB' });
    }
    
    if (err.message === 'Tipo de arquivo não suportado') {
        return res.status(415).json({ error: err.message });
    }

    res.status(500).json({ 
        error: 'Erro interno do servidor',
        ...(process.env.NODE_ENV === 'development' && { details: err.message })
    });
});

// Inicialização
const PORT = process.env.PORT || 27752;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📁 Acesse os uploads em: http://localhost:${PORT}/uploads`);
    console.log(`🛠️  Modo: ${process.env.NODE_ENV || 'development'}`);
});