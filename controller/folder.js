const Folder = require('../model/folder');
const File = require('../model/file');
const fs = require('fs');
const path = require('path');

exports.createFolder = async (req, res) => {
  try {
    const { name, parentFolder } = req.body;
    const folder = new Folder({
      name,
      owner: req.user.id,
      parentFolder: parentFolder || null
    });

    await folder.save();

    if (parentFolder) {
      await Folder.findByIdAndUpdate(parentFolder, { $push: { subfolders: folder._id } });
    }

    res.status(201).json(folder);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


exports.getFolderContents = async (req, res) => {
  try {
    const { folderId } = req.params;

    const query = { owner: req.user.id };
    if (folderId) query.parentFolder = folderId;
    else query.parentFolder = null;

    const folders = await Folder.find(query);
    const files = await File.find(query);

    res.json({ folders, files });
  } catch (err) {
    console.error("Error in getFolderContents:", err);
    res.status(500).json({ message: err.message });
  }
};


exports.updateFolder = async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);
    if (!folder) return res.status(404).json({ message: 'Folder not found' });
    if (folder.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

    const updatedFolder = await Folder.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedFolder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


const deleteFolderRecursive = async (folderId, userId) => {
  const folder = await Folder.findOne({ _id: folderId, owner: userId });
  if (!folder) return;

  // Delete all files in this folder (both DB + uploads folder)
  const files = await File.find({ parentFolder: folder._id, owner: userId });
  for (const file of files) {
    try {
      const filePath = path.join(__dirname, '..', file.filePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // delete from /uploads
      }
      await file.deleteOne(); // remove from DB
    } catch (err) {
      console.error(`Failed to delete file ${file.name}:`, err.message);
    }
  }

  // Recursively delete subfolders
  const subfolders = await Folder.find({ parentFolder: folder._id, owner: userId });
  for (const sub of subfolders) {
    await deleteFolderRecursive(sub._id, userId);
  }

  // Finally delete this folder
  await folder.deleteOne();
};

exports.deleteFolder = async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);
    if (!folder) return res.status(404).json({ message: 'Folder not found' });
    if (folder.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await deleteFolderRecursive(folder._id, req.user.id);

    res.json({ message: 'Folder and its contents deleted successfully' });
  } catch (err) {
    console.error("Error deleting folder:", err);
    res.status(500).json({ message: err.message });
  }
};

