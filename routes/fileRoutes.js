const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/multer');
const { uploadFile, getFiles, deleteFile, downloadFile } = require('../controller/file');

// File routes
router.post('/upload', auth, upload.single('file'), uploadFile);
router.get('/', auth, getFiles);
router.delete('/:id', auth, deleteFile);
router.get('/download/:id', auth, downloadFile);

module.exports = router;
