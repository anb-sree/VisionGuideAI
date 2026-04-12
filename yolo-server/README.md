# VisionGuide YOLO Detection Server

Real-time object detection API for VisionGuide AI mobile app.

## Setup

### 1. Install Python (if not installed)
Download from: https://www.python.org/downloads/

### 2. Install Dependencies

```bash
cd yolo-server
pip install -r requirements.txt
```

### 3. Run Server

```bash
python yolo_server.py
```

Server starts at: `http://0.0.0.0:8000`

## Find Your IP Address

### Windows
```bash
ipconfig
```
Look for "IPv4 Address" (e.g., `192.168.1.5`)

### Mac/Linux
```bash
ifconfig
```
Look for "inet" address

## Test the Server

Open browser: `http://localhost:8000`

Should see: `{"status": "online", "model": "YOLOv8n"}`

## API Documentation

Interactive docs: `http://localhost:8000/docs`

## Troubleshooting

### Model Download
First run downloads YOLOv8n model (~6MB). Wait for completion.

### Port Already in Use
Change port in `yolo_server.py`:
```python
uvicorn.run(app, host="0.0.0.0", port=8001)  # Changed to 8001
```

### Firewall Issues
Allow Python through Windows Firewall when prompted.

## Usage from React Native

Update server URL in app:
```javascript
const SERVER_URL = 'http://YOUR_IP:8000';
```

Replace `YOUR_IP` with your laptop's IP address.