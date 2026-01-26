import { MongoClient } from 'mongodb';

async function initializeDatabase() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB for initialization');
    
    const db = client.db('kitchen_monitoring');
    
    // Create collections with indexes
    const dishesCollection = db.collection('dishes');
    const detectionHistoryCollection = db.collection('detection_history');
    
    // Create indexes for better performance
    await dishesCollection.createIndex({ cameraId: 1 }, { unique: true });
    await dishesCollection.createIndex({ lastUpdated: -1 });
    
    await detectionHistoryCollection.createIndex({ timestamp: -1 });
    await detectionHistoryCollection.createIndex({ cameraId: 1, timestamp: -1 });
    await detectionHistoryCollection.createIndex({ status: 1 });
    
    // Insert default camera configuration
    await dishesCollection.updateOne(
      { cameraId: 'kitchen_main' },
      {
        $setOnInsert: {
          cameraId: 'kitchen_main',
          cameraName: 'Main Kitchen Camera',
          location: 'Kitchen Area',
          isActive: true,
          createdAt: new Date(),
          lastUpdated: new Date(),
          latestStatus: {
            status: 'empty',
            confidence: 0,
            items: []
          }
        }
      },
      { upsert: true }
    );
    
    console.log('Database initialization completed successfully');
    
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Run initialization if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase()
    .then(() => {
      console.log('Initialization completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Initialization failed:', error);
      process.exit(1);
    });
}

export { initializeDatabase };
