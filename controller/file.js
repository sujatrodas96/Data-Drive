// controllers/fileController.js
const File = require('../model/file');
const Folder = require('../model/folder');
const supabase = require('../utils/superbase');

// Upload file to Supabase (no local disk, direct from buffer)
exports.uploadFile = async (req, res) => {
  try {
    const { parentFolder } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // generate unique path in Supabase
    const supabasePath = `user-${req.user.id}/${Date.now()}-${req.file.originalname}`;

    // upload file buffer directly
    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .upload(supabasePath, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    // get public URL
    const { data: urlData } = supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .getPublicUrl(supabasePath);

    // save metadata in DB
    const file = new File({
      name: req.file.originalname,
      owner: req.user.id,
      parentFolder: parentFolder || null,
      filePath: supabasePath,   // Supabase path
      mimeType: req.file.mimetype,
      size: req.file.size,
    });

    await file.save();

    if (parentFolder) {
      await Folder.findByIdAndUpdate(parentFolder, { $push: { files: file._id } });
    }

    res.status(201).json({ ...file.toObject(), publicUrl: urlData.publicUrl });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(400).json({ message: err.message });
  }
};

// Get all files for user
exports.getFiles = async (req, res) => {
  try {
    const files = await File.find({ owner: req.user.id }).populate('parentFolder');

    // attach public URLs
    const filesWithUrls = files.map(f => {
      const { data } = supabase.storage
        .from(process.env.SUPABASE_BUCKET)
        .getPublicUrl(f.filePath);
      return { ...f.toObject(), publicUrl: data.publicUrl };
    });

    res.json(filesWithUrls);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.downloadFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });
    if (file.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { data, error } = await supabase.storage  // get public URL
      .from(process.env.SUPABASE_BUCKET)  // Supabase bucket
      .createSignedUrl(file.filePath, 60); // 60s validity

    if (error) return res.status(500).json({ message: error.message });
    res.json({ url: data.signedUrl });
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Delete file from Supabase + DB
exports.deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });
    if (file.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // delete from Supabase
    const { error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .remove([file.filePath]);

    if (error) {
      console.warn("Supabase delete error:", error.message);
    }

    // delete from DB
    await file.deleteOne();

    res.json({ message: 'File deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
