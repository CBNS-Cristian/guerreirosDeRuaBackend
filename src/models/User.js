const db = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
  static async findByEmail(email) {
    const [rows] = await db.query(
      'SELECT id, nome, email, senha, tipo FROM usuarios WHERE email = ? LIMIT 1', 
      [email]
    );
    return rows[0] || null;
  }

    static async create({ nome, email, senha, tipo = 'padrao' }) {
        try {
            console.log('Iniciando criação de usuário:', { email, tipo });
            
            // Criptografa a senha
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(senha, salt);
            
            console.log('Senha criptografada');
            
            const [result] = await db.query(
                'INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)',
                [nome, email, hash, tipo]
            );
            
            console.log('Usuário inserido no banco, ID:', result.insertId);
            
            return { 
                id: result.insertId, 
                nome, 
                email, 
                tipo 
            };
        } catch (error) {
            console.error('Erro no model User.create:', error);
            throw error;
        }
    }

  static async updatePassword(email, newPassword) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    
    await db.query(
      'UPDATE usuarios SET senha = ? WHERE email = ?',
      [hash, email]
    );
  }
}

module.exports = User;