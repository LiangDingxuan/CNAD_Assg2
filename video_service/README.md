# Kitchen Video Monitoring Service

A real-time video streaming and dish detection service for monitoring kitchen activities using AI-powered object detection.

## Features

- **Live Video Streaming**: Real-time video streaming from kitchen cameras
- **Dish Detection**: AI-powered detection of dish preparation status
- **WebSocket Communication**: Low-latency bidirectional communication
- **MongoDB Integration**: Persistent storage of detection results
- **REST API**: RESTful endpoints for historical data access

## Architecture

### Components

1. **Video Streaming Server**: Handles WebSocket connections and video frame processing
2. **AI Model Integration**: Uses TensorFlow.js and COCO-SSD for object detection
3. **Database Layer**: MongoDB for storing detection history and camera configurations
4. **REST API**: HTTP endpoints for accessing historical data

### Dish Status Detection

The system analyzes video frames to determine dish preparation status:

- **Empty**: No dishware detected
- **Preparing**: Dishware detected but no food
- **In Progress**: Food detected but missing utensils
- **Completed**: Food, dishware, and utensils all detected

## Installation

### Prerequisites

- Node.js 18+
- MongoDB
- Docker (optional)

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Set environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Initialize database:
```bash
npm run init-db
```

4. Start development server:
```bash
npm run dev
```

### Docker Deployment

1. Build and run with docker-compose:
```bash
docker-compose up video-service
```

## API Endpoints

### WebSocket Connection

- **URL**: `ws://localhost:3001`
- **Message Types**:
  - `video_frame`: Send base64 encoded image for analysis
  - `get_detection_history`: Request historical detection data

### REST API

- `GET /api/status` - Service status
- `GET /api/dishes` - Get camera configurations
- `GET /api/detection-history` - Get detection history

## Frontend Integration

### Environment Variables

Add to your frontend `.env`:
```
VITE_VIDEO_SERVICE_URL=ws://localhost:3004
```

### Usage Example

```typescript
import VideoStreamer from '@/components/kitchen/VideoStreamer';

function KitchenPage() {
  return <VideoStreamer />;
}
```

## Configuration

### Environment Variables

- `PORT`: Server port (default: 3001)
- `MONGODB_URI`: MongoDB connection string
- `NODE_ENV`: Environment (development/production)

### Camera Setup

1. Position cameras to capture kitchen work areas
2. Ensure proper lighting for object detection
3. Configure camera resolution (recommended: 1280x720)

## AI Model

The system uses COCO-SSD (Common Objects in Context) for object detection:

- **Supported Objects**: Bowl, plate, cup, fork, knife, spoon, food items
- **Confidence Threshold**: Configurable (default: 0.5)
- **Processing Speed**: ~2-3 frames per second

## Performance Considerations

- **Frame Rate**: Limited to 2 FPS for optimal performance
- **Image Resolution**: Automatically resized to 640x480 for processing
- **Memory Usage**: TensorFlow.js models require ~500MB RAM
- **CPU Usage**: Object detection is CPU-intensive

## Troubleshooting

### Common Issues

1. **Camera Access Denied**
   - Check browser permissions
   - Ensure HTTPS in production

2. **High CPU Usage**
   - Reduce frame rate
   - Lower image resolution
   - Consider GPU acceleration

3. **Detection Accuracy**
   - Improve lighting conditions
   - Adjust camera angles
   - Fine-tune confidence thresholds

### Logs

Enable debug logging:
```bash
DEBUG=video-service:* npm start
```

## Development

### Project Structure

```
src/
├── server.js              # Main server file
├── database/
│   └── init.js           # Database initialization
└── services/
    ├── videoProcessor.js # Video frame processing
    └── aiDetector.js     # AI model integration
```

### Adding New Detection Logic

1. Modify `analyzeDishStatus()` in `server.js`
2. Update status definitions
3. Test with sample images

## Security

- WebSocket connections require authentication (in production)
- Video streams are encrypted with WSS
- Database access is restricted
- Input validation on all endpoints

## Monitoring

### Health Checks

- `GET /api/status` returns service health
- Docker health check included
- MongoDB connection monitoring

### Metrics

- WebSocket connection count
- Detection accuracy rates
- Processing latency
- Error rates

## License

MIT License
