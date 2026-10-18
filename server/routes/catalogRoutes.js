const express = require('express');
const { getCatalogActivities } = require('../controllers/catalogController');

const router = express.Router();

router.get('/', getCatalogActivities);

module.exports = router;
