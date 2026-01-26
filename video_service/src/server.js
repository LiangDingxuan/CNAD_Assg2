import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import * as tf from '@tensorflow/tfjs-node';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import sharp from 'sharp';
import { RTSPStream } from 'node-rtsp-stream';

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB connection
let db;
let dishesCollection;
let detectionHistoryCollection;

async function connectToMongoDB() {
  try {
    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://mongodb:27017/kitchen_monitoring');
    await client.connect();
    db = client.db();
    dishesCollection = db.collection('dishes');
    detectionHistoryCollection = db.collection('detection_history');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
}

// AI Model
let model;
async function loadModel() {
  try {
    model = await cocoSsd.load();
    console.log('AI Model loaded successfully');
  } catch (error) {
    console.error('Error loading AI model:', error);
  }
}

// WebSocket connections
const clients = new Set();

wss.on('connection', (ws) => {
  console.log('New WebSocket client connected');
  clients.add(ws);

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'video_frame') {
        await processVideoFrame(data.image, ws);
      } else if (data.type === 'get_detection_history') {
        await sendDetectionHistory(ws);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

// Process video frame for dish detection
async function processVideoFrame(base64Image, clientWs) {
  try {
    if (!model) {
      console.log('Model not loaded yet');
      return;
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Image, 'base64');
    
    // Resize image for better performance
    const resizedBuffer = await sharp(imageBuffer)
      .resize(640, 480)
      .jpeg({ quality: 80 })
      .toBuffer();

    // Decode image for TensorFlow
    const image = tf.node.decodeImage(resizedBuffer, 3);
    
    // Run object detection
    const predictions = await model.detect(image);
    
    // Analyze predictions for dish completion
    const dishStatus = analyzeDishStatus(predictions);
    
    // Save detection result
    await saveDetectionResult(dishStatus, predictions);
    
    // Send result back to client
    const result = {
      type: 'detection_result',
      timestamp: new Date().toISOString(),
      dishStatus,
      predictions: predictions.map(p => ({
        class: p.class,
        score: p.score,
        bbox: p.bbox
      }))
    };
    
    clientWs.send(JSON.stringify(result));
    
    // Broadcast to all other clients
    clients.forEach(client => {
      if (client !== clientWs && client.readyState === 1) {
        client.send(JSON.stringify(result));
      }
    });
    
    // Clean up tensor
    image.dispose();
    
  } catch (error) {
    console.error('Error processing video frame:', error);
    clientWs.send(JSON.stringify({ 
      type: 'error', 
      message: 'Failed to process frame' 
    }));
  }
}

// Analyze dish status based on predictions
function analyzeDishStatus(predictions) {
  const dishClasses = ['bowl', 'plate', 'cup', 'fork', 'knife', 'spoon', 'food'];
  const relevantPredictions = predictions.filter(p => 
    dishClasses.some(cls => p.class.toLowerCase().includes(cls))
  );
  
  // Simple logic for dish completion detection
  const hasFood = relevantPredictions.some(p => p.class.toLowerCase().includes('food'));
  const hasUtensils = relevantPredictions.some(p => 
    ['fork', 'knife', 'spoon'].some(utensil => p.class.toLowerCase().includes(utensil))
  );
  const hasDishware = relevantPredictions.some(p => 
    ['bowl', 'plate', 'cup'].some(dish => p.class.toLowerCase().includes(dish))
  );
  
  let status = 'empty';
  if (hasFood && hasUtensils && hasDishware) {
    status = 'completed';
  } else if (hasFood && hasDishware) {
    status = 'in_progress';
  } else if (hasDishware) {
    status = 'preparing';
  }
  
  return {
    status,
    confidence: calculateConfidence(relevantPredictions),
    items: relevantPredictions.map(p => p.class)
  };
}

// Calculate confidence score
function calculateConfidence(predictions) {
  if (predictions.length === 0) return 0;
  const avgScore = predictions.reduce((sum, p) => sum + p.score, 0) / predictions.length;
  return Math.round(avgScore * 100);
}

// Save detection result to database
async function saveDetectionResult(dishStatus, predictions) {
  try {
    const detectionRecord = {
      timestamp: new Date(),
      status: dishStatus.status,
      confidence: dishStatus.confidence,
      items: dishStatus.items,
      predictions: predictions,
      cameraId: 'kitchen_main'
    };
    
    await detectionHistoryCollection.insertOne(detectionRecord);
    
    // Update latest status in dishes collection
    await dishesCollection.updateOne(
      { cameraId: 'kitchen_main' },
      { 
        $set: {
          latestStatus: dishStatus,
          lastUpdated: new Date()
        }
      },
      { upsert: true }
    );
    
  } catch (error) {
    console.error('Error saving detection result:', error);
  }
}

// Send detection history to client
async function sendDetectionHistory(ws) {
  try {
    const history = await detectionHistoryCollection
      .find({})
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();
    
    ws.send(JSON.stringify({
      type: 'detection_history',
      data: history
    }));
    
  } catch (error) {
    console.error('Error fetching detection history:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to fetch history'
    }));
  }
}

// REST API endpoints
app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    clients: clients.size,
    modelLoaded: !!model
  });
});

app.get('/api/dishes', async (req, res) => {
  try {
    const dishes = await dishesCollection.find({}).toArray();
    res.json(dishes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dishes' });
  }
});

app.get('/api/detection-history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const history = await detectionHistoryCollection
      .find({})
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch detection history' });
  }
});

// Initialize services
async function initialize() {
  await connectToMongoDB();
  await loadModel();
}

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Video streaming server running on port ${PORT}`);
  initialize();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});
