"""
VisionGuide AI - YOLO Detection Server
Provides real-time object detection via REST API
"""

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import cv2
import numpy as np
from typing import List, Dict
import uvicorn
import os
import socket

app = FastAPI(title="YOLO Detection Server")

# Enable CORS for all origins (allows mobile app to connect)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load YOLO model
print("Loading YOLO model...")
model = YOLO('yolov8n.pt')
print("✅ Model loaded successfully")

def get_local_ip():
    """Get the local IP address of this machine"""
    try:
        # Create a socket to get local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception:
        return "localhost"

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "model": "yolov8n.pt",
        "message": "YOLO Detection Server is running",
        "server_ip": get_local_ip()
    }

@app.post("/detect")
async def detect_objects(file: UploadFile = File(...)):
    """
    Detect objects in uploaded image
    Returns: List of detections with class, confidence, and bounding boxes
    """
    try:
        # Read uploaded image
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            return {
                "success": False,
                "error": "Failed to decode image",
                "detections": []
            }
        
        # Run YOLO detection
        results = model(image, verbose=False)
        
        # Extract detections
        detections = []
        for result in results:
            boxes = result.boxes
            for box in boxes:
                # Get box coordinates
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                
                # Get confidence and class
                confidence = float(box.conf[0].cpu().numpy())
                class_id = int(box.cls[0].cpu().numpy())
                class_name = model.names[class_id]
                
                detections.append({
                    "class": class_name,
                    "confidence": confidence,
                    "bbox": [float(x1), float(y1), float(x2), float(y2)]
                })
        
        return {
            "success": True,
            "detections": detections,
            "count": len(detections)
        }
        
    except Exception as e:
        print(f"❌ Detection error: {e}")
        return {
            "success": False,
            "error": str(e),
            "detections": []
        }

if __name__ == "__main__":
    local_ip = get_local_ip()
    
    print("\n" + "="*60)
    print("🚀 YOLO Detection Server - PERMANENT FIX")
    print("="*60)
    print(f"\n✅ Server starting on:")
    print(f"   Local:    http://localhost:8000")
    print(f"   Network:  http://{local_ip}:8000")
    print(f"\n📱 USE THIS IN YOUR APP:")
    print(f"   const SERVER_URL = 'http://{local_ip}:8000';")
    print("\n" + "="*60 + "\n")
    
    # Run server on all network interfaces
    uvicorn.run(
        app,
        host="0.0.0.0",  # Listen on all interfaces
        port=8000,
        log_level="info",
        access_log=True
    )