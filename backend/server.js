require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const exifr = require('exifr');
const PDFDocument = require('pdfkit');
const sharp = require('sharp');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'sih2024defaultsecretkey';

// Setup directories
const UPLOAD_FOLDER = path.join(__dirname, 'static', 'uploads');
const PREDICTION_FOLDER = path.join(__dirname, 'static', 'predictions');
const REPORT_FOLDER = path.join(__dirname, 'static', 'reports');

fs.mkdirSync(UPLOAD_FOLDER, { recursive: true });
fs.mkdirSync(PREDICTION_FOLDER, { recursive: true });
fs.mkdirSync(REPORT_FOLDER, { recursive: true });

// Middleware
app.use(cors());
app.use(express.json());
app.use('/static/uploads', express.static(UPLOAD_FOLDER));
app.use('/static/predictions', express.static(PREDICTION_FOLDER));
app.use('/static/reports', express.static(REPORT_FOLDER));

// Multer file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_FOLDER);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// MongoDB Schemas
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const uploadSchema = new mongoose.Schema({
  email: { type: String, required: true },
  originalFilename: { type: String, required: true },
  predictedFilename: { type: String },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  objectCounts: { type: Map, of: Number, default: {} },
  timestamp: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Upload = mongoose.model('Upload', uploadSchema);

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// ---------------- AUTH ROUTES ----------------

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, name: user.name, email: user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, name: user.name, email: user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  res.json({ email: req.user.email, name: req.user.name });
});

// ---------------- INFERENCE & PREDICTION ----------------

app.post('/api/predict', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const filePath = req.file.path;
    let latitude = req.body.latitude ? parseFloat(req.body.latitude) : null;
    let longitude = req.body.longitude ? parseFloat(req.body.longitude) : null;

    // Extract GPS from EXIF if not provided manually
    if (latitude === null || longitude === null || isNaN(latitude) || isNaN(longitude)) {
      try {
        const gps = await exifr.gps(filePath);
        if (gps && gps.latitude && gps.longitude) {
          latitude = gps.latitude;
          longitude = gps.longitude;
        }
      } catch (exifErr) {
        console.warn('EXIF parse warning:', exifErr.message);
      }
    }

    // Check if coordinates exist
    if (latitude === null || longitude === null || isNaN(latitude) || isNaN(longitude)) {
      // Remove temporary file
      fs.unlinkSync(filePath);
      return res.status(400).json({ 
        error: 'No geolocation metadata found in the image. Please enter Latitude and Longitude manually.' 
      });
    }

    // Spawn Python process to perform YOLO inference
    const scriptPath = path.join(__dirname, 'yolo_helper.py');
    const pythonProcess = spawn('python', [scriptPath, filePath, latitude, longitude]);

    let stdoutData = '';
    let stderrData = '';

    pythonProcess.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    pythonProcess.on('close', async (code) => {
      if (code !== 0) {
        console.error('Python execution error:', stderrData);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        return res.status(500).json({ error: 'YOLO model execution failed', details: stderrData });
      }

      try {
        // Parse python JSON output
        const output = JSON.parse(stdoutData.trim());
        if (output.error) {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          return res.status(500).json({ error: output.error });
        }

        // Save to Database
        const uploadRecord = new Upload({
          email: req.user.email,
          originalFilename: req.file.filename,
          predictedFilename: output.filename,
          latitude: latitude,
          longitude: longitude,
          objectCounts: output.object_counts || {}
        });
        await uploadRecord.save();

        res.json({
          message: 'Prediction completed successfully',
          image_url: `/static/predictions/${output.filename}`,
          latitude,
          longitude,
          objectCounts: output.object_counts || {},
          redirect_url: '/scanning'
        });
      } catch (parseErr) {
        console.error('Parse stdout error:', stdoutData, parseErr);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        res.status(500).json({ error: 'Failed to process YOLO helper outputs' });
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/predict_image', authenticateToken, async (req, res) => {
  try {
    const latest = await Upload.findOne({ email: req.user.email }).sort({ timestamp: -1 });
    if (!latest) {
      return res.status(404).json({ error: 'No predictions found' });
    }
    res.json({
      image_url: `/static/predictions/${latest.predictedFilename}`,
      original_url: `/static/uploads/${latest.originalFilename}`,
      latitude: latest.latitude,
      longitude: latest.longitude,
      objectCounts: latest.objectCounts || {}
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/uploaded_images', authenticateToken, async (req, res) => {
  try {
    const records = await Upload.find({ email: req.user.email }).sort({ timestamp: -1 });
    const list = records.map(r => r.originalFilename);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/predicted_images', authenticateToken, async (req, res) => {
  try {
    const records = await Upload.find({ email: req.user.email }).sort({ timestamp: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Analytics Route
app.get('/api/reports', authenticateToken, async (req, res) => {
  try {
    const records = await Upload.find({ email: req.user.email });
    let totalRooftops = 0;
    let totalWaterbodies = 0;
    let totalRoads = 0;
    let totalTrees = 0;
    let otherCounts = {};

    records.forEach(r => {
      const counts = r.objectCounts;
      if (!counts) return;
      
      for (let [label, val] of counts.entries()) {
        const lowerLabel = label.toLowerCase();
        if (lowerLabel.includes('roof') || lowerLabel.includes('building') || lowerLabel.includes('house')) {
          totalRooftops += val;
        } else if (lowerLabel.includes('water') || lowerLabel.includes('river') || lowerLabel.includes('pond')) {
          totalWaterbodies += val;
        } else if (lowerLabel.includes('road') || lowerLabel.includes('street') || lowerLabel.includes('path')) {
          totalRoads += val;
        } else if (lowerLabel.includes('tree') || lowerLabel.includes('vegetation') || lowerLabel.includes('forest')) {
          totalTrees += val;
        } else {
          otherCounts[label] = (otherCounts[label] || 0) + val;
        }
      }
    });

    res.json({
      totalUploads: records.length,
      rooftops: totalRooftops,
      waterbodies: totalWaterbodies,
      roads: totalRoads,
      trees: totalTrees,
      others: otherCounts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- PDF REPORT ROUTE ----------------

app.post('/api/generate_report', authenticateToken, async (req, res) => {
  try {
    const { object_counts } = req.body;
    if (!object_counts || typeof object_counts !== 'object') {
      return res.status(400).json({ error: 'Invalid object counts provided' });
    }

    const doc = new PDFDocument({ margin: 50 });
    
    // Set headers to trigger PDF download on client
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=feature_analysis_report.pdf');
    
    doc.pipe(res);

    // Document header
    doc.fillColor('#2c3e50').fontSize(24).text('Drone Imagery Feature Analysis Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#7f8c8d').text(`Report Generated On: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.text(`User Account: ${req.user.email}`, { align: 'center' });
    doc.moveDown(1.5);
    
    // Draw line divider
    doc.strokeColor('#bdc3c7').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1.5);

    // Section: Executive Summary
    doc.fillColor('#2980b9').fontSize(16).text('1. Executive Summary');
    doc.moveDown(0.5);
    doc.fillColor('#34495e').fontSize(11).text(
      'This data-driven report contains deep-learning-based feature extraction and segmentation results compiled from processed drone orthophotos. The YOLO segmentation model identifies visual structures and maps their occurrence rates for urban planning, precision agriculture, and land boundary classification applications.'
    );
    doc.moveDown(1.5);

    // Section: Detected Objects List
    doc.fillColor('#2980b9').fontSize(16).text('2. Object Detection & Counting');
    doc.moveDown(0.5);

    // Build Table Header
    const tableTop = doc.y;
    doc.fillColor('#2c3e50').fontSize(11).text('Feature Category', 70, tableTop, { bold: true });
    doc.text('Instance Count', 300, tableTop, { bold: true });
    doc.text('Status', 450, tableTop, { bold: true });
    
    doc.moveDown(0.3);
    doc.strokeColor('#ecf0f1').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // Table rows
    let itemY = doc.y;
    Object.keys(object_counts).forEach((key) => {
      doc.fillColor('#34495e').fontSize(11).text(key, 70, itemY);
      doc.text(`${object_counts[key]} instances`, 300, itemY);
      doc.fillColor('#27ae60').text('Verified', 450, itemY);
      itemY += 20;
    });

    doc.y = itemY + 15;
    doc.moveDown(1);

    // Section: Findings and Analysis
    doc.fillColor('#2980b9').fontSize(16).text('3. Detailed Analysis & Observations');
    doc.moveDown(0.5);
    
    let findingsList = '';
    const keys = Object.keys(object_counts);
    if (keys.length === 0) {
      findingsList = 'No feature classes were detected within this analysis request.';
    } else {
      findingsList = `Analysis results verify the presence of various mapped surfaces, namely: ${keys.join(', ')}. Each object was classified based on its pixel intensity and shape characteristics. These boundaries provide critical spatial intelligence for land dispute resolutions, infrastructure development, and flood mapping assessments.`;
    }
    
    doc.fillColor('#34495e').fontSize(11).text(findingsList, { align: 'justify' });
    doc.moveDown(1.5);

    // Section: Conclusion
    doc.fillColor('#2980b9').fontSize(16).text('4. Conclusion & Recommendations');
    doc.moveDown(0.5);
    doc.fillColor('#34495e').fontSize(11).text(
      'The mapping pipeline has parsed the orthophotos, resolved EXIF metadata tags, and projected structural boundaries. We recommend exporting these boundaries directly into local GIS platforms to run comprehensive cadastral assessments and crop density indices.',
      { align: 'justify' }
    );
    doc.moveDown(2.5);

    // Footer signature
    doc.fontSize(10).fillColor('#7f8c8d').text('Authorized by: Fusion AI Analytics Pipeline', 50, 700, { align: 'left' });
    doc.text('Smart India Hackathon Initiative 2024', 350, 700, { align: 'right' });

    doc.end();
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({ error: 'Failed to generate PDF report' });
  }
});

// Run server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
