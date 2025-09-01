const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const folderController = require('../controller/folder');

// Create folder
router.post('/create', auth, folderController.createFolder);

// Get root folder contents
router.get('/', auth, folderController.getFolderContents);

// Get subfolder contents by ID
router.get('/:folderId', auth, folderController.getFolderContents);

// Update folder
router.put('/:id', auth, folderController.updateFolder);

// Delete folder
router.delete('/:id', auth, folderController.deleteFolder);

module.exports = router;
