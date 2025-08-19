const Animal = require('../models/Animal');
const fs = require('fs');
const path = require('path');

module.exports = {
    async listarAnimais(req, res) {
        try {
            const animais = await Animal.findAll();
            
            // Adicionar URL completa para as imagens
            const animaisComUrl = animais.map(animal => ({
                ...animal,
                foto_url: animal.foto ? `${req.protocol}://${req.get('host')}/uploads/${animal.foto}` : null
            }));
            
            res.json(animaisComUrl);
        } catch (error) {
            console.error('Erro ao listar animais:', error);
            res.status(500).json({ 
                error: 'Erro ao buscar animais',
                details: process.env.NODE_ENV === 'development' ? error.message : null
            });
        }
    },

    async cadastrarAnimal(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'Nenhuma imagem foi enviada' });
            }

            const { nome, tipo, nascimento, data_resgate, descricao } = req.body;

            if (!nome || !tipo) {
                fs.unlinkSync(path.join(__dirname, '../uploads', req.file.filename));
                return res.status(400).json({ error: 'Nome e tipo são obrigatórios' });
            }

            const novoAnimal = await Animal.create({
                nome,
                tipo,
                nascimento: nascimento || null,
                data_resgate: data_resgate || new Date().toISOString().split('T')[0],
                descricao: descricao || '',
                foto: req.file.filename,
                adotado: false
            });

            // Adicionar URL completa da foto
            const animalComUrl = {
                ...novoAnimal,
                foto_url: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
            };

            res.status(201).json(animalComUrl);

        } catch (error) {
            console.error('Erro ao cadastrar animal:', error);
            if (req.file) {
                fs.unlinkSync(path.join(__dirname, '../uploads', req.file.filename));
            }
            res.status(500).json({ 
                error: 'Erro ao cadastrar animal',
                details: process.env.NODE_ENV === 'development' ? error.message : null
            });
        }
    },

    async buscarAnimalPorId(req, res) {
        try {
            const animal = await Animal.findByPk(req.params.id);
            if (!animal) {
                return res.status(404).json({ error: 'Animal não encontrado' });
            }
            
            // Adicionar URL completa da foto
            const animalComUrl = {
                ...animal,
                foto_url: animal.foto ? `${req.protocol}://${req.get('host')}/uploads/${animal.foto}` : null
            };
            
            res.json(animalComUrl);
        } catch (error) {
            res.status(500).json({ 
                error: 'Erro ao buscar animal',
                details: process.env.NODE_ENV === 'development' ? error.message : null
            });
        }
    },

    async atualizarAnimal(req, res) {
        try {
            const { id } = req.params;
            const animal = await Animal.findByPk(id);
            
            if (!animal) {
                if (req.file) fs.unlinkSync(path.join(__dirname, '../uploads', req.file.filename));
                return res.status(404).json({ error: 'Animal não encontrado' });
            }

            const dadosAtualizados = {
                nome: req.body.nome || animal.nome,
                tipo: req.body.tipo || animal.tipo,
                nascimento: req.body.nascimento || animal.nascimento,
                data_resgate: req.body.data_resgate || animal.data_resgate,
                descricao: req.body.descricao || animal.descricao,
                foto: req.file ? req.file.filename : animal.foto,
                adotado: req.body.adotado || animal.adotado
            };

            // Remove a foto antiga se foi enviada uma nova
            if (req.file && animal.foto) {
                fs.unlinkSync(path.join(__dirname, '../uploads', animal.foto));
            }

            const animalAtualizado = await Animal.update(id, dadosAtualizados);
            
            // Adicionar URL completa da foto
            const animalComUrl = {
                ...animalAtualizado,
                foto_url: dadosAtualizados.foto ? `${req.protocol}://${req.get('host')}/uploads/${dadosAtualizados.foto}` : null
            };
            
            res.json(animalComUrl);

        } catch (error) {
            if (req.file) {
                fs.unlinkSync(path.join(__dirname, '../uploads', req.file.filename));
            }
            res.status(500).json({ 
                error: 'Erro ao atualizar animal',
                details: process.env.NODE_ENV === 'development' ? error.message : null
            });
        }
    },

    async marcarComoAdotado(req, res) {
       try {
        const animal = await Animal.findByPk(req.params.id);
        if (!animal) {
            return res.status(404).json({ error: 'Animal não encontrado' });
        }

        await Animal.update(req.params.id, { adotado: true });
        res.json({ message: 'Animal marcado como adotado com sucesso!' });
         } catch (error) {
        res.status(500).json({ 
            error: 'Erro ao atualizar status',
            details: process.env.NODE_ENV === 'development' ? error.message : null
        });
        }
    },

    async excluirAnimal(req, res) {
        try {
            const animal = await Animal.findByPk(req.params.id);
            if (!animal) {
                return res.status(404).json({ error: 'Animal não encontrado' });
            }

            if (animal.foto) {
                fs.unlinkSync(path.join(__dirname, '../uploads', animal.foto));
            }

            await Animal.destroy(req.params.id);
            res.json({ message: 'Animal excluído com sucesso!' });
        } catch (error) {
            res.status(500).json({ 
                error: 'Erro ao excluir animal',
                details: process.env.NODE_ENV === 'development' ? error.message : null
            });
        }
    }
};