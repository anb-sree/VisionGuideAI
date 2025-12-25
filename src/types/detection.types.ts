// src/types/detection.types.ts

export interface DetectedObject {
  class: string;           // e.g., "person", "chair", "car"
  confidence: number;      // 0-1 (e.g., 0.95 = 95% confidence)
  bbox: BoundingBox;       // Bounding box coordinates
  position: ObjectPosition; // left, center, or right
  distance?: string;       // "near", "medium", "far" (estimated)
}

export interface BoundingBox {
  x: number;      // Top-left X coordinate
  y: number;      // Top-left Y coordinate
  width: number;  // Box width
  height: number; // Box height
}

export type ObjectPosition = 'left' | 'center' | 'right';

export interface DetectionResult {
  objects: DetectedObject[];
  timestamp: number;
  frameSize: {
    width: number;
    height: number;
  };
}

// Priority levels for announcements
export enum ObjectPriority {
  CRITICAL = 'critical',  // Immediate obstacles in path
  HIGH = 'high',          // Nearby objects
  MEDIUM = 'medium',      // Detected but not immediate
  LOW = 'low'            // Background objects
}

// Object categories
export const CRITICAL_OBJECTS = [
  'person',
  'bicycle',
  'car',
  'motorcycle',
  'bus',
  'truck',
  'traffic light',
  'stop sign',
];

export const OBSTACLE_OBJECTS = [
  'chair',
  'couch',
  'potted plant',
  'bed',
  'dining table',
  'toilet',
  'bench',
  'fire hydrant',
  'parking meter',
];

export const NAVIGATION_OBJECTS = [
  'door',
  'stairs',
  'escalator',
  'elevator',
];