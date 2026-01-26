import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import sharp from 'sharp';

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

// WebSocket connections
const clients = new Set();

wss.on('connection', (ws) => {
  console.log('New WebSocket client connected');
  clients.add(ws);

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'detection_result') {
        await saveDetectionResult(data.dishStatus, data.predictions);
        // Broadcast to all other clients
        clients.forEach(client => {
          if (client !== ws && client.readyState === 1) {
            client.send(JSON.stringify(data));
          }
        });
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
    aiProcessing: 'client-side'
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
