const mongoose = require('mongoose');
const Folder = require('./folder');
const User = require('./user');

const fileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  parentFolder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder' },
  filePath: { type: String, required: true },
  mimeType: { type: String },
  size: { type: Number },
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('File', fileSchema);
