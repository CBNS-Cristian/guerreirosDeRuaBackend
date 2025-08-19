const Animal = require('../models/Animal');
const fs = require('fs');
const path = require('path');

module.exports = {
    async listarAnimais(req, res) {
        try {
            const animais = await Animal.findAll();
            
           
            const animaisComUrl = animais.map(animal => {
                let foto_url = null;
                
                if (animal.foto) {
                 
                    foto_url = `${req.protocol}://${req.get('host')}/api/animais/imagem/${animal.foto}`;
                }
                
                return {
                    ...animal,
                    foto_url: foto_url
                };
            });
            
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

           
            const animalComUrl = {
                ...novoAnimal,
                foto_url: `${req.protocol}://${req.get('host')}/api/animais/imagem/${req.file.filename}`
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
            
          
            let foto_url = null;
            if (animal.foto) {
                foto_url = `${req.protocol}://${req.get('host')}/api/animais/imagem/${animal.foto}`;
            }
            
            const animalComUrl = {
                ...animal,
                foto_url: foto_url
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
                adotado: req.body.adotado !== undefined ? req.body.adotado : animal.adotado
            };

          
            if (req.file && animal.foto && animal.foto !== req.file.filename) {
                try {
                    fs.unlinkSync(path.join(__dirname, '../uploads', animal.foto));
                } catch (error) {
                    console.warn('Não foi possível remover a imagem antiga:', error.message);
                }
            }

            const animalAtualizado = await Animal.update(id, dadosAtualizados);
            
          
            let foto_url = null;
            if (dadosAtualizados.foto) {
                foto_url = `${req.protocol}://${req.get('host')}/api/animais/imagem/${dadosAtualizados.foto}`;
            }
            
            const animalComUrl = {
                ...animalAtualizado,
                foto_url: foto_url
            };
            
            res.json(animalComUrl);

        } catch (error) {
            if (req.file) {
                try {
                    fs.unlinkSync(path.join(__dirname, '../uploads', req.file.filename));
                } catch (unlinkError) {
                    console.warn('Não foi possível remover a imagem:', unlinkError.message);
                }
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
                try {
                    fs.unlinkSync(path.join(__dirname, '../uploads', animal.foto));
                } catch (error) {
                    console.warn('Não foi possível remover a imagem:', error.message);
                }
            }

            await Animal.destroy(req.params.id);
            res.json({ message: 'Animal excluído com sucesso!' });
        } catch (error) {
            res.status(500).json({ 
                error: 'Erro ao excluir animal',
                details: process.env.NODE_ENV === 'development' ? error.message : null
            });
        }
    },

    // Método para servir imagens através da API
    async servirImagem(req, res) {
        try {
            const { filename } = req.params;
            const filePath = path.join(__dirname, '../uploads', filename);
            
            console.log('Tentando servir imagem:', filename);
            console.log('Caminho do arquivo:', filePath);
            
            // Verifica se arquivo existe
            if (!fs.existsSync(filePath)) {
                console.log('Arquivo não encontrado:', filePath);
                return res.status(404).json({ error: 'Imagem não encontrada' });
            }

            // Headers para evitar bloqueio ORB
            res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Expose-Headers', '*');
            res.setHeader('Timing-Allow-Origin', '*');
            res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 horas

            // Configurar content-type baseado na extensão
            if (filename.endsWith('.png')) {
                res.setHeader('Content-Type', 'image/png');
            } else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) {
                res.setHeader('Content-Type', 'image/jpeg');
            } else if (filename.endsWith('.gif')) {
                res.setHeader('Content-Type', 'image/gif');
            } else {
                res.setHeader('Content-Type', 'application/octet-stream');
            }
            
            // Servir o arquivo
            const stream = fs.createReadStream(filePath);
            stream.on('error', (error) => {
                console.error('Erro ao ler arquivo:', error);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Erro ao carregar imagem' });
                }
            });
            
            stream.pipe(res);
            
        } catch (error) {
            console.error('Erro ao servir imagem:', error);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Erro interno ao carregar imagem' });
            }
        }
    }
};