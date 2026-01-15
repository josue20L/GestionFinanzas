const express = require('express');
const router = express.Router();

const { requireAuth, requireAdmin } = require('../middleware/auth');
const usuarioController = require('../controllers/usuarioController');

router.use(requireAuth);
router.use(requireAdmin);

router.get('/', usuarioController.listView);
router.get('/nuevo', usuarioController.newView);
router.post('/', usuarioController.create);
router.get('/:id/editar', usuarioController.editView);
router.post('/:id', usuarioController.update);
router.post('/:id/eliminar', usuarioController.remove);

module.exports = router;
