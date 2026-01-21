const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'taskmanager';

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in .env file');
  process.exit(1);
}

async function getDatabaseSchema() {
  const client = new MongoClient(MONGODB_URI, { 
    serverApi: { 
      version: '1', 
      strict: true, 
      deprecationErrors: true 
    } 
  });

  try {
    await client.connect();
    console.log('Connected to MongoDB!');
    
    const db = client.db(DB_NAME);
    const collections = await db.listCollections().toArray();
    
    let markdown = `# Database Schema\n\n`;
    
    for (const collection of collections) {
      const collectionName = collection.name;
      markdown += `## ${collectionName}\n\n`;
      
      // Get sample document
      const sampleDoc = await db.collection(collectionName).findOne({});
      
      if (sampleDoc) {
        // Get all unique fields and their types
        const fields = {};
        
        // Function to process document recursively
        const processObject = (obj, prefix = '') => {
          for (const [key, value] of Object.entries(obj)) {
            if (key === '_id') continue; // Skip _id field
            
            const fieldName = prefix ? `${prefix}.${key}` : key;
            const type = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
            
            if (type === 'object' && value !== null && !Array.isArray(value)) {
              // For nested objects, process recursively
              processObject(value, fieldName);
            } else {
              // For primitive types or arrays
              fields[fieldName] = {
                type: type,
                example: JSON.stringify(value).slice(0, 50) + (JSON.stringify(value).length > 50 ? '...' : '')
              };
            }
          }
        };
        
        processObject(sampleDoc);
        
        // Generate markdown table
        markdown += '| Field | Type | Example |\n';
        markdown += '|-------|------|---------|\n';
        
        for (const [field, info] of Object.entries(fields)) {
          markdown += `| \`${field}\` | \`${info.type}\` | \`${info.example}\` |\n`;
        }
      } else {
        markdown += 'No documents found in this collection.\n';
      }
      
      // Add indexes information
      const indexes = await db.collection(collectionName).indexes();
      if (indexes.length > 0) {
        markdown += '\n**Indexes:**\n\n';
        markdown += '| Name | Fields | Unique |\n';
        markdown += '|------|--------|--------|\n';
        
        for (const index of indexes) {
          if (index.name === '_id_') continue; // Skip default _id index
          
          const fields = Object.entries(index.key).map(([field, order]) => 
            `${field} (${order === 1 ? 'asc' : 'desc'})`
          ).join(', ');
          
          markdown += `| ${index.name} | ${fields} | ${index.unique ? '✅' : '❌'} |\n`;
        }
      }
      
      markdown += '\n---\n\n';
    }
    
    // Write to file
    const outputPath = path.resolve(__dirname, '../DATABASE_SCHEMA.md');
    fs.writeFileSync(outputPath, markdown);
    console.log(`✅ Database schema saved to ${outputPath}`);
    
    return markdown;
  } catch (error) {
    console.error('Error generating database schema:', error);
    throw error;
  } finally {
    await client.close();
  }
}

getDatabaseSchema()
  .catch(console.error);
