const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 27752,
    ssl: {
        ca: fs.readFileSync(path.join(__dirname, '../ca.pem'))
    },
    waitForConnections: true,
    connectionLimit: 15,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000
});

// Teste de conexão ao iniciar
pool.getConnection()
    .then(conn => {
        console.log('✅ Conectado ao banco de dados Aiven MySQL');
        conn.release();
    })
    .catch(err => {
        console.error('❌ Erro de conexão com o banco:', err.message);
        process.exit(1);
    });

module.exports = pool;