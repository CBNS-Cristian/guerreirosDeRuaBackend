const express = require('express');
const router = express.Router();
const upload = require('../config/upload');
const animalController = require('../controllers/animalController');

// Rotas CRUD completas para animais
router.route('/')
  .get(animalController.listarAnimais)
  .post(upload.single('foto'), animalController.cadastrarAnimal);

router.route('/:id')
  .get(animalController.buscarAnimalPorId)
  .put(upload.single('foto'), animalController.atualizarAnimal)
  .delete(animalController.excluirAnimal);

router.patch('/:id/adotar', animalController.marcarComoAdotado);

module.exports = router;