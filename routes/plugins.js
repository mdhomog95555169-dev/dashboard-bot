const express = require('express');
const router = express.Router();
router.get('/', (req, res) => res.json({ status: 'Plugins route working' }));
module.exports = router;
