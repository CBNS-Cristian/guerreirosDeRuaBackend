require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const animalRoutes = require('./routes/animalRoutes');
const authRoutes = require('./routes/authRoutes');
const rateLimit = require('express-rate-limit');

const app = express();

app.set('trust proxy', 1); 

// Middlewares - CORS primeiro
app.use(cors({
    origin: [
        'https://cbns-cristian.github.io',
        'https://guerreirosderua.onrender.com',
        'http://localhost:5500',
        'http://localhost:3000'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin'],
    credentials: true,
    optionsSuccessStatus: 200
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting mais generoso
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: JSON.stringify({
    error: 'Muitas requisições. Tente novamente em 15 minutos.'
  }),
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false }
});

// Aplicar rate limit apenas em produção
if (process.env.NODE_ENV === 'production') {
  app.use('/api/', limiter);
}

// Middleware específico para arquivos estáticos (IMPORTANTE: resolver ORB)
app.use('/uploads', (req, res, next) => {
    // Headers para evitar bloqueio ORB
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    next();
}, express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res, path) => {
        // Configurar content-type correto baseado na extensão do arquivo
        if (path.endsWith('.png')) {
            res.setHeader('Content-Type', 'image/png');
        } else if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
            res.setHeader('Content-Type', 'image/jpeg');
        } else if (path.endsWith('.gif')) {
            res.setHeader('Content-Type', 'image/gif');
        }
    }
}));

// Rotas
app.use('/api/animais', animalRoutes);
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'online',
        timestamp: new Date().toISOString(),
        ip: req.ip,
        forwarded: req.headers['x-forwarded-for']
    });
});

// Rota de fallback para SPA
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
    console.log(`🔒 Trust proxy: ${app.get('trust proxy')}`);
});