const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const asyncHandler = require('../utils/asyncHandler');
const { buildVehicleReport } = require('../utils/vehicleReport');

const CSV_FIELDS = [
  { label: 'Registration Number', value: 'registrationNumber' },
  { label: 'Name', value: 'name' },
  { label: 'Type', value: 'type' },
  { label: 'Status', value: 'status' },
  { label: 'Total Distance (km)', value: 'totalDistanceKm' },
  { label: 'Total Fuel (L)', value: 'totalFuelLiters' },
  { label: 'Fuel Efficiency (km/L)', value: 'fuelEfficiencyKmPerL' },
  { label: 'Total Fuel Cost', value: 'totalFuelCost' },
  { label: 'Total Maintenance Cost', value: 'totalMaintenanceCost' },
  { label: 'Operational Cost', value: 'operationalCost' },
  { label: 'Total Revenue', value: 'totalRevenue' },
  { label: 'Completed Trips', value: 'completedTrips' },
  { label: 'Acquisition Cost', value: 'acquisitionCost' },
  { label: 'ROI', value: 'roi' },
];

// GET /api/reports/vehicles
const getVehicleReport = asyncHandler(async (req, res) => {
  const report = await buildVehicleReport();
  res.json(report);
});

// GET /api/reports/vehicles/csv
const exportVehicleReportCsv = asyncHandler(async (req, res) => {
  const report = await buildVehicleReport();
  const parser = new Parser({ fields: CSV_FIELDS });
  const csv = parser.parse(report);

  res.header('Content-Type', 'text/csv');
  res.attachment(`transitops-vehicle-report-${Date.now()}.csv`);
  res.send(csv);
});

// GET /api/reports/vehicles/pdf
const exportVehicleReportPdf = asyncHandler(async (req, res) => {
  const report = await buildVehicleReport();

  res.header('Content-Type', 'application/pdf');
  res.attachment(`transitops-vehicle-report-${Date.now()}.pdf`);

  const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
  doc.pipe(res);

  doc.fontSize(16).text('TransitOps - Vehicle Performance Report', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(9).fillColor('#555').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
  doc.moveDown(1);

  const columns = [
    { key: 'registrationNumber', label: 'Reg. No.', width: 70 },
    { key: 'name', label: 'Name', width: 90 },
    { key: 'type', label: 'Type', width: 55 },
    { key: 'status', label: 'Status', width: 60 },
    { key: 'totalDistanceKm', label: 'Dist (km)', width: 55 },
    { key: 'fuelEfficiencyKmPerL', label: 'km/L', width: 45 },
    { key: 'operationalCost', label: 'Op. Cost', width: 65 },
    { key: 'totalRevenue', label: 'Revenue', width: 65 },
    { key: 'roi', label: 'ROI', width: 50 },
  ];

  let y = doc.y;
  const startX = doc.x;
  doc.fontSize(9).font('Helvetica-Bold');
  let x = startX;
  columns.forEach((col) => {
    doc.text(col.label, x, y, { width: col.width, continued: false });
    x += col.width;
  });
  y += 16;
  doc.moveTo(startX, y - 4).lineTo(x, y - 4).stroke();

  doc.font('Helvetica').fontSize(8);
  report.forEach((row) => {
    if (y > 520) {
      doc.addPage();
      y = doc.y;
    }
    x = startX;
    columns.forEach((col) => {
      const val = row[col.key];
      doc.text(val === null || val === undefined ? '-' : String(val), x, y, { width: col.width });
      x += col.width;
    });
    y += 14;
  });

  doc.end();
});

module.exports = { getVehicleReport, exportVehicleReportCsv, exportVehicleReportPdf };
