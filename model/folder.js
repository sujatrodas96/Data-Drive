const mongoose = require('mongoose');
const File = require('./file');
const User = require('./user');

const folderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  parentFolder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder' },
  subfolders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Folder' }]
});

module.exports = mongoose.model('Folder', folderSchema);
