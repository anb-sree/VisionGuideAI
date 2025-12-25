"""
VisionGuide AI - YOLO Detection Server
Provides real-time object detection via REST API
"""

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import cv2
import numpy as np
from io import BytesIO
import uvicorn
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(title="VisionGuide YOLO API")

# Enable CORS for React Native
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load YOLO model (downloads automatically first time)
logger.info("Loading YOLOv8 model...")
model = YOLO('yolov8n.pt')  # Nano version - fast and accurate
logger.info("✅ Model loaded successfully")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "model": "YOLOv8n",
        "message": "VisionGuide YOLO Detection Server"
    }

@app.post("/detect")
async def detect_objects(file: UploadFile = File(...)):
    """
    Detect objects in uploaded image
    
    Args:
        file: Image file (JPEG/PNG)
    
    Returns:
        JSON with detections array
    """
    try:
        # Read image bytes
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return {"error": "Invalid image", "detections": []}
        
        # Get image dimensions
        height, width = img.shape[:2]
        logger.info(f"Processing image: {width}x{height}")
        
        # Run YOLO detection
        results = model(img, verbose=False)[0]
        
        # Format detections for React Native
        detections = []
        for box in results.boxes:
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            
            detection = {
                "class": results.names[int(box.cls[0])],
                "confidence": float(box.conf[0]),
                "bbox": {
                    "x": float(x1),
                    "y": float(y1),
                    "width": float(x2 - x1),
                    "height": float(y2 - y1)
                }
            }
            detections.append(detection)
        
        logger.info(f"✅ Detected {len(detections)} objects")
        
        return {
            "success": True,
            "detections": detections,
            "image_size": {
                "width": width,
                "height": height
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Error: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "detections": []
        }

if __name__ == "__main__":
    print("=" * 50)
    print("🚀 VisionGuide YOLO Detection Server")
    print("=" * 50)
    print("📍 Server will run at: http://0.0.0.0:8000")
    print("📖 API Docs: http://localhost:8000/docs")
    print("🔍 Health check: http://localhost:8000/")
    print("=" * 50)
    
    uvicorn.run(
        app, 
        host="0.0.0.0",  # Accessible from network
        port=8000,
        log_level="info"
    )