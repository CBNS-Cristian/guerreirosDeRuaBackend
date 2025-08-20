const Animal = require('../models/Animal');
const fs = require('fs');
const path = require('path');

module.exports = {
    async listarAnimais(req, res) {
        try {
            const animais = await Animal.findAll();
            
            // ✅ MÉTODO GARANTIDO: Base64 incorporado no JSON
            const animaisComImagens = await Promise.all(
                animais.map(async (animal) => {
                    let imagem_base64 = null;
                    
                    if (animal.foto) {
                        try {
                            imagem_base64 = await this.lerImagemComoBase64(animal.foto);
                        } catch (error) {
                            console.warn(`Imagem ${animal.foto} não encontrada:`, error.message);
                        }
                    }
                    
                    return {
                        id: animal.id,
                        nome: animal.nome,
                        tipo: animal.tipo,
                        nascimento: animal.nascimento,
                        descricao: animal.descricao,
                        data_resgate: animal.data_resgate,
                        adotado: animal.adotado,
                        imagem_base64: imagem_base64  // ✅ IMAGEM DIRETA NO JSON
                    };
                })
            );
            
            res.json(animaisComImagens);
        } catch (error) {
            console.error('Erro ao listar animais:', error);
            res.status(500).json({ 
                error: 'Erro ao buscar animais',
                details: process.env.NODE_ENV === 'development' ? error.message : null
            });
        }
    },

    // Método para ler imagem como Base64
    async lerImagemComoBase64(filename) {
        return new Promise((resolve, reject) => {
            const filePath = path.join(__dirname, '../uploads', filename);
            
            fs.access(filePath, fs.constants.F_OK, (err) => {
                if (err) {
                    reject(new Error('Arquivo não encontrado'));
                    return;
                }
                
                fs.readFile(filePath, (error, data) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    
                    const base64 = data.toString('base64');
                    let mimeType = 'image/png';
                    
                    if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) {
                        mimeType = 'image/jpeg';
                    } else if (filename.endsWith('.gif')) {
                        mimeType = 'image/gif';
                    }
                    
                    resolve(`data:${mimeType};base64,${base64}`);
                });
            });
        });
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

            // ✅ Retorna a imagem já em Base64
            let imagem_base64 = null;
            try {
                imagem_base64 = await this.lerImagemComoBase64(req.file.filename);
            } catch (error) {
                console.warn('Erro ao processar imagem nova:', error.message);
            }

            res.status(201).json({
                id: novoAnimal.id,
                nome: novoAnimal.nome,
                tipo: novoAnimal.tipo,
                nascimento: novoAnimal.nascimento,
                descricao: novoAnimal.descricao,
                data_resgate: novoAnimal.data_resgate,
                adotado: novoAnimal.adotado,
                imagem_base64: imagem_base64  // ✅ IMAGEM DIRETA NO JSON
            });

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
            
            // ✅ Retorna com Base64
            let imagem_base64 = null;
            if (animal.foto) {
                try {
                    imagem_base64 = await this.lerImagemComoBase64(animal.foto);
                } catch (error) {
                    console.warn('Erro ao carregar imagem:', error.message);
                }
            }
            
            res.json({
                id: animal.id,
                nome: animal.nome,
                tipo: animal.tipo,
                nascimento: animal.nascimento,
                descricao: animal.descricao,
                data_resgate: animal.data_resgate,
                adotado: animal.adotado,
                imagem_base64: imagem_base64  // ✅ IMAGEM DIRETA NO JSON
            });
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
            
            // ✅ Retorna com Base64
            let imagem_base64 = null;
            if (dadosAtualizados.foto) {
                try {
                    imagem_base64 = await this.lerImagemComoBase64(dadosAtualizados.foto);
                } catch (error) {
                    console.warn('Erro ao carregar imagem atualizada:', error.message);
                }
            }
            
            res.json({
                id: animalAtualizado.id,
                nome: animalAtualizado.nome,
                tipo: animalAtualizado.tipo,
                nascimento: animalAtualizado.nascimento,
                descricao: animalAtualizado.descricao,
                data_resgate: animalAtualizado.data_resgate,
                adotado: animalAtualizado.adotado,
                imagem_base64: imagem_base64  // ✅ IMAGEM DIRETA NO JSON
            });

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
    }
};