// src/types/detection.types.ts

/**
 * Position of object relative to camera view
 * 'left', 'center', 'right'
 */
export type Position = 'left' | 'center' | 'right';

/**
 * Estimated distance category
 */
export type Distance = 'very close' | 'close' | 'medium' | 'far';

/**
 * Detected object with all metadata
 */
export interface DetectedObject {
  class: string;           // Object class name (e.g., 'person', 'chair')
  confidence: number;      // Detection confidence (0-1)
  bbox: number[];          // Bounding box [x1, y1, x2, y2]
  position: Position;      // Position: 'left', 'center', 'right'
  distance: Distance;      // Distance: 'very close', 'close', 'medium', 'far'
}

/**
 * Detection result with metadata
 */
export interface DetectionResult {
  objects: DetectedObject[];
  timestamp: number;
  frameSize: {
    width: number;
    height: number;
  };
}

/**
 * Server detection response format
 */
export interface ServerDetection {
  class: string;
  confidence: number;
  bbox: number[];
}

/**
 * Server response format
 */
export interface ServerResponse {
  success: boolean;
  detections: ServerDetection[];
  processing_time?: number;
}