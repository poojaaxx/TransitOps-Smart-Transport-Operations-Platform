const { Vehicle, VehicleDocument } = require('../models');
const asyncHandler = require('../utils/asyncHandler');

// POST /api/vehicles/:id/documents (multipart, field name "file")
const uploadDocument = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findByPk(req.params.id);
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const doc = await VehicleDocument.create({
    vehicleId: vehicle._id,
    name: req.body.name || req.file.originalname,
    fileUrl: `/uploads/documents/${req.file.filename}`,
    mimeType: req.file.mimetype,
  });
  res.status(201).json(doc);
});

// GET /api/vehicles/:id/documents
const listDocuments = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findByPk(req.params.id);
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
  const documents = await VehicleDocument.findAll({ where: { vehicleId: req.params.id } });
  res.json(documents);
});

// DELETE /api/vehicles/:id/documents/:docId
const deleteDocument = asyncHandler(async (req, res) => {
  const doc = await VehicleDocument.findOne({ where: { _id: req.params.docId, vehicleId: req.params.id } });
  if (!doc) return res.status(404).json({ message: 'Document not found' });
  await doc.destroy();
  res.json({ message: 'Document removed' });
});

module.exports = { uploadDocument, listDocuments, deleteDocument };
