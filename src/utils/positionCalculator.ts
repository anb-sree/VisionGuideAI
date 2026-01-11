// src/utils/positionCalculator.ts
import { Position, Distance } from '../types/detection.types';

/**
 * Calculate horizontal position of object relative to screen
 * @param bbox Bounding box [x1, y1, x2, y2]
 * @param frameWidth Width of the frame
 * @returns Position as 'left', 'center', or 'right'
 */
export function calculatePosition(bbox: number[], frameWidth: number): Position {
  const [x1, , x2] = bbox;
  
  // Calculate center of bounding box
  const objectCenterX = (x1 + x2) / 2;
  
  // Divide screen into three zones
  const leftThreshold = frameWidth * 0.33;
  const rightThreshold = frameWidth * 0.67;
  
  console.log(`📍 Position calc: objectCenter=${objectCenterX.toFixed(0)}, leftThresh=${leftThreshold.toFixed(0)}, rightThresh=${rightThreshold.toFixed(0)}, width=${frameWidth}`);
  
  if (objectCenterX < leftThreshold) {
    console.log('   → LEFT');
    return 'left';
  } else if (objectCenterX > rightThreshold) {
    console.log('   → RIGHT');
    return 'right';
  } else {
    console.log('   → CENTER');
    return 'center';
  }
}

/**
 * Estimate distance based on bounding box size
 * @param bbox Bounding box [x1, y1, x2, y2]
 * @param frameWidth Width of the frame
 * @param frameHeight Height of the frame
 * @returns Distance as 'very close', 'close', 'medium', or 'far'
 */
export function estimateDistance(
  bbox: number[],
  frameWidth: number,
  frameHeight: number
): Distance {
  const [x1, y1, x2, y2] = bbox;
  
  // Calculate bounding box dimensions
  const width = x2 - x1;
  const height = y2 - y1;
  
  // Calculate area as percentage of frame
  const bboxArea = width * height;
  const frameArea = frameWidth * frameHeight;
  const areaPercentage = (bboxArea / frameArea) * 100;
  
  console.log(`📏 Distance calc: bbox=${width.toFixed(0)}x${height.toFixed(0)}, area=${areaPercentage.toFixed(1)}%`);
  
  // Classify based on area percentage
  if (areaPercentage > 30) {
    console.log('   → VERY CLOSE');
    return 'very close';
  } else if (areaPercentage > 15) {
    console.log('   → CLOSE');
    return 'close';
  } else if (areaPercentage > 5) {
    console.log('   → MEDIUM');
    return 'medium';
  } else {
    console.log('   → FAR');
    return 'far';
  }
}

/**
 * Calculate if object is in direct path (used for collision detection)
 */
export function isInDirectPath(bbox: number[], frameWidth: number): boolean {
  const [x1, , x2] = bbox;
  const objectCenterX = (x1 + x2) / 2;
  const centerZoneStart = frameWidth * 0.40;
  const centerZoneEnd = frameWidth * 0.60;
  
  return objectCenterX >= centerZoneStart && objectCenterX <= centerZoneEnd;
}

/**
 * Calculate priority score for an object (higher = more important)
 */
export function calculatePriorityScore(
  position: Position,
  distance: Distance,
  confidence: number
): number {
  let score = 0;
  
  // Distance scoring (most important)
  switch (distance) {
    case 'very close':
      score += 100;
      break;
    case 'close':
      score += 50;
      break;
    case 'medium':
      score += 25;
      break;
    case 'far':
      score += 10;
      break;
  }
  
  // Position scoring
  switch (position) {
    case 'center':
      score += 40;
      break;
    case 'left':
    case 'right':
      score += 20;
      break;
  }
  
  // Confidence scoring
  score += confidence * 15;
  
  return score;
}