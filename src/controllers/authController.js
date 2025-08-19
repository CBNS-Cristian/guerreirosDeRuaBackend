const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = {
  async login(req, res) {
    try {
      console.log('Dados recebidos:', req.body);
      
      const { email, senha } = req.body;
      if (!email || !senha) {
        console.log('Email ou senha faltando');
        return res.status(400).json({ error: "Email e senha são obrigatórios" });
      }

      const cleanEmail = email.toString().trim().toLowerCase();
      const cleanSenha = senha.toString().trim();

      console.log('Buscando usuário:', cleanEmail);
      const user = await User.findByEmail(cleanEmail);
      
      if (!user) {
        console.log('Usuário não encontrado');
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      console.log('Comparando senha...');
      const isMatch = await bcrypt.compare(cleanSenha, user.senha);
      
      if (!isMatch) {
        console.log('Senha não confere');
        console.log('Hash armazenado:', user.senha);
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      console.log('Autenticação bem-sucedida');
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );

      return res.json({
        token,
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email
        }
      });

    } catch (error) {
      console.error('Erro completo no login:', error);
      return res.status(500).json({ error: "Erro interno no servidor" });
    }
  },

  async register(req, res) {
    try {
      console.log('Dados recebidos no registro:', req.body); // Log para depuração
      
      const { nome, email, senha, tipo } = req.body;

      // Validações básicas
      if (!nome || !email || !senha) {
        console.log('Campos obrigatórios faltando');
        return res.status(400).json({ 
          error: "Nome, email e senha são obrigatórios",
          receivedData: req.body // Para ajudar na depuração
        });
      }

      if (senha.length < 6) {
        return res.status(400).json({ error: "Senha deve ter no mínimo 6 caracteres" });
      }

      // Verifica se usuário já existe
      const userExists = await User.findByEmail(email);
      if (userExists) {
        console.log('Tentativa de cadastro com email existente:', email);
        return res.status(409).json({ error: "Email já cadastrado" });
      }

      // Cria o usuário
      console.log('Criando novo usuário:', { email, tipo });
      const user = await User.create({
        nome,
        email,
        senha, // O model User vai criptografar
        tipo: tipo || 'padrao'
      });

      console.log('Usuário criado com ID:', user.id);

      // Gera token JWT
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );

      return res.status(201).json({
        message: "Usuário criado com sucesso",
        token,
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          tipo: user.tipo
        }
      });

    } catch (error) {
      console.error('Erro completo no registro:', error);
      return res.status(500).json({ 
        error: "Erro ao cadastrar usuário",
        details: process.env.NODE_ENV === 'development' ? error.message : null
      });
    }
},

  // Métodos para desenvolvimento
  async resetPassword(req, res) {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ error: "Acesso negado" });
    }

    try {
      const { email, newPassword } = req.body;
      const hash = await bcrypt.hash(newPassword, 10);
      
      await User.updatePassword(email, hash);
      
      return res.json({ success: true });
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      return res.status(500).json({ error: "Erro ao resetar senha" });
    }
  },

  async forceResetPassword(req, res) {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ error: "Acesso negado" });
    }

    try {
      const { email, newPassword } = req.body;
      const hash = await bcrypt.hash(newPassword, 10);
      
      // Atualiza diretamente no banco
      await db.query(
        'UPDATE usuarios SET senha = ? WHERE email = ?',
        [hash, email]
      );
      
      return res.json({ 
        success: true,
        message: 'Senha resetada com sucesso' 
      });
    } catch (error) {
      console.error('Erro no forceReset:', error);
      return res.status(500).json({ error: "Erro ao resetar senha" });
    }
  }
};