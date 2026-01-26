import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Camera, 
  CameraOff, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Play,
  Pause
} from 'lucide-react';

interface DetectionResult {
  type: 'detection_result';
  timestamp: string;
  dishStatus: {
    status: 'empty' | 'preparing' | 'in_progress' | 'completed';
    confidence: number;
    items: string[];
  };
  predictions: Array<{
    class: string;
    score: number;
    bbox: number[];
  }>;
}

interface DetectionHistory {
  timestamp: string;
  status: string;
  confidence: number;
  items: string[];
}

const VideoStreamer: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [detectionHistory, setDetectionHistory] = useState<DetectionHistory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const WEBSOCKET_URL = import.meta.env.VITE_VIDEO_SERVICE_URL || 'ws://localhost:3001';

  // Initialize WebSocket connection
  const initializeWebSocket = useCallback(() => {
    try {
      const ws = new WebSocket(WEBSOCKET_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Connected to video service');
        setIsConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'detection_result') {
            setDetectionResult(data);
            setDetectionHistory(prev => [data.dishStatus, ...prev.slice(0, 9)]);
          } else if (data.type === 'error') {
            setError(data.message);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        console.log('Disconnected from video service');
        setIsConnected(false);
        // Attempt to reconnect after 3 seconds
        setTimeout(initializeWebSocket, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection error');
      };

    } catch (err) {
      console.error('Error initializing WebSocket:', err);
      setError('Failed to connect to video service');
    }
  }, [WEBSOCKET_URL]);

  // Start video streaming
  const startStreaming = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment'
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Failed to access camera. Please ensure camera permissions are granted.');
    }
  };

  // Stop video streaming
  const stopStreaming = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsStreaming(false);
  };

  // Capture and send frame for analysis
  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !wsRef.current || 
        !isStreaming || isPaused || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== 4) {
      return;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64 and send to server
    const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
    
    wsRef.current.send(JSON.stringify({
      type: 'video_frame',
      image: base64Image
    }));

    // Schedule next frame capture
    animationFrameRef.current = requestAnimationFrame(captureFrame);
  }, [isStreaming, isPaused]);

  // Initialize WebSocket on component mount
  useEffect(() => {
    initializeWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [initializeWebSocket]);

  // Start frame capture when streaming and connected
  useEffect(() => {
    if (isStreaming && isConnected && !isPaused) {
      // Start capturing frames after a short delay
      const timeoutId = setTimeout(() => {
        captureFrame();
      }, 1000);
      return () => clearTimeout(timeoutId);
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, [isStreaming, isConnected, isPaused, captureFrame]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStreaming();
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'preparing': return 'bg-blue-500';
      case 'empty': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'in_progress': return <Clock className="w-4 h-4" />;
      case 'preparing': return <Camera className="w-4 h-4" />;
      case 'empty': return <CameraOff className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Kitchen Monitoring System
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
            <Badge variant={isStreaming ? "default" : "secondary"}>
              {isStreaming ? "Streaming" : "Not Streaming"}
            </Badge>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            {!isStreaming ? (
              <Button 
                onClick={startStreaming}
                disabled={!isConnected}
                className="flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Start Camera
              </Button>
            ) : (
              <Button 
                onClick={stopStreaming}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <CameraOff className="w-4 h-4" />
                Stop Camera
              </Button>
            )}
            
            {isStreaming && (
              <Button
                onClick={() => setIsPaused(!isPaused)}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                {isPaused ? "Resume" : "Pause"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Video Stream */}
      <Card>
        <CardHeader>
          <CardTitle>Live Kitchen Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full rounded-lg bg-black"
              style={{ maxHeight: '480px' }}
            />
            <canvas
              ref={canvasRef}
              className="hidden"
            />
            {isPaused && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                <div className="text-white text-lg font-semibold">Paused</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detection Results */}
      {detectionResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(detectionResult.dishStatus.status)}
              Dish Detection Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Badge className={`${getStatusColor(detectionResult.dishStatus.status)} text-white`}>
                {detectionResult.dishStatus.status.replace('_', ' ').toUpperCase()}
              </Badge>
              <span className="text-sm text-gray-600">
                Confidence: {detectionResult.dishStatus.confidence}%
              </span>
            </div>
            
            {detectionResult.dishStatus.items.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Detected Items:</h4>
                <div className="flex flex-wrap gap-2">
                  {detectionResult.dishStatus.items.map((item, index) => (
                    <Badge key={index} variant="outline">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <div className="text-xs text-gray-500">
              Last updated: {new Date(detectionResult.timestamp).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detection History */}
      {detectionHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Detection History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {detectionHistory.map((detection, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(detection.status)}
                    <span className="text-sm">{detection.status.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{detection.confidence}%</Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(detection.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VideoStreamer;
