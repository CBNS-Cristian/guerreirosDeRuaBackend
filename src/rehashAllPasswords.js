async function forceResetPassword(req, res) {
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