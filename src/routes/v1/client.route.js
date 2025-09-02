const express = require('express');
const { createClient, getAllClients, getClient } = require('../../controllers/client.controller');

const router = express.Router();

router.post('/create-client', createClient);
router.get('/get-all-clients', getAllClients);
router.get('/get-client/:id', getClient);

module.exports = router;