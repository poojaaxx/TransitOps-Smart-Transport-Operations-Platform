const Vehicle = require('../models/Vehicle');
const asyncHandler = require('../utils/asyncHandler');

// POST /api/vehicles/:id/documents (multipart, field name "file")
const uploadDocument = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  vehicle.documents.push({
    name: req.body.name || req.file.originalname,
    fileUrl: `/uploads/documents/${req.file.filename}`,
    mimeType: req.file.mimetype,
  });
  await vehicle.save();
  res.status(201).json(vehicle.documents[vehicle.documents.length - 1]);
});

// GET /api/vehicles/:id/documents
const listDocuments = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id).select('documents');
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
  res.json(vehicle.documents);
});

// DELETE /api/vehicles/:id/documents/:docId
const deleteDocument = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
  vehicle.documents = vehicle.documents.filter((d) => d._id.toString() !== req.params.docId);
  await vehicle.save();
  res.json({ message: 'Document removed' });
});

module.exports = { uploadDocument, listDocuments, deleteDocument };
