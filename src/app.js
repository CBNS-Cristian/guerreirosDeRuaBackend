require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const animalRoutes = require('./routes/animalRoutes');
const authRoutes = require('./routes/authRoutes');
const rateLimit = require('express-rate-limit');

const app = express();

// Configuração de proxy confiável
app.set('trust proxy', 1);

// Middlewares - CORS primeiro
app.use(cors({
    origin: [
        'https://cbns-cristian.github.io',
        'https://guerreirosderua.onrender.com',
        'http://localhost:5500',
        'http://localhost:3000',
        'http://127.0.0.1:5500',
        'http://127.0.0.1:3000'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    exposedHeaders: ['Content-Length', 'Content-Type'],
    credentials: true,
    optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: JSON.stringify({
    error: 'Muitas requisições. Tente novamente em 15 minutos.'
  }),
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

app.use('/uploads', (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});


app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res, filePath) => {
        // Headers para evitar bloqueio ORB (redundante mas seguro)
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Type');
        
        // Configurar content-type correto
        if (filePath.endsWith('.png')) {
            res.setHeader('Content-Type', 'image/png');
        } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
            res.setHeader('Content-Type', 'image/jpeg');
        } else if (filePath.endsWith('.gif')) {
            res.setHeader('Content-Type', 'image/gif');
        }
        
        // Cache para imagens
        res.setHeader('Cache-Control', 'public, max-age=86400');
    }
}));

// Rotas
app.use('/api/animais', animalRoutes);
app.use('/api/auth', authRoutes);

// Health check melhorado
app.get('/health', (req, res) => {
    const fs = require('fs');
    const uploadsPath = path.join(__dirname, 'uploads');
    
    let uploadsCount = 0;
    try {
        uploadsCount = fs.readdirSync(uploadsPath).length;
    } catch (error) {
        console.warn('Pasta uploads não encontrada:', error.message);
    }
    
    res.status(200).json({ 
        status: 'online',
        timestamp: new Date().toISOString(),
        uploads: uploadsCount,
        environment: process.env.NODE_ENV || 'development'
    });
});

// Rota para verificar arquivos existentes
app.get('/api/debug/files', (req, res) => {
    const fs = require('fs');
    const uploadsPath = path.join(__dirname, 'uploads');
    
    try {
        const files = fs.readdirSync(uploadsPath);
        res.json({ files: files, count: files.length });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao ler pasta uploads', details: error.message });
    }
});

// Rota de fallback
app.get('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint não encontrado' });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('[ERRO]', err.stack);
    
    if (err.statusCode === 429) {
        return res.status(429).json({ 
            error: 'Muitas requisições. Tente novamente mais tarde.'
        });
    }
    
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'Arquivo muito grande. Tamanho máximo: 5MB' });
    }
    
    res.status(500).json({ 
        error: 'Erro interno do servidor',
        ...(process.env.NODE_ENV === 'development' && { details: err.message })
    });
});

// Inicialização
const PORT = process.env.PORT || 27752;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`🌐 URLs disponíveis:`);
    console.log(`   - Local: http://localhost:${PORT}`);
    console.log(`   - Network: http://0.0.0.0:${PORT}`);
    console.log(`📁 Uploads: http://localhost:${PORT}/uploads`);
    console.log(`🛠️  Modo: ${process.env.NODE_ENV || 'development'}`);
});