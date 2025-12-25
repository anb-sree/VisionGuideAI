// src/utils/positionCalculator.ts

import { BoundingBox, ObjectPosition } from '../types/detection.types';

/**
 * Calculate if object is on left, center, or right of screen
 */
export const calculatePosition = (
  bbox: BoundingBox,
  frameWidth: number
): ObjectPosition => {
  // Calculate center point of bounding box
  const objectCenterX = bbox.x + bbox.width / 2;
  
  // Divide screen into 3 zones
  const leftBoundary = frameWidth * 0.33;   // 0-33%
  const rightBoundary = frameWidth * 0.67;  // 67-100%
  
  if (objectCenterX < leftBoundary) {
    return 'left';
  } else if (objectCenterX > rightBoundary) {
    return 'right';
  } else {
    return 'center';
  }
};

/**
 * Estimate distance based on bounding box size
 * Larger box = closer object
 */
export const estimateDistance = (
  bbox: BoundingBox,
  frameWidth: number,
  frameHeight: number
): string => {
  // Calculate what % of screen the object takes up
  const objectArea = bbox.width * bbox.height;
  const screenArea = frameWidth * frameHeight;
  const areaPercentage = (objectArea / screenArea) * 100;
  
  if (areaPercentage > 30) {
    return 'very close'; // Object takes up >30% of screen
  } else if (areaPercentage > 15) {
    return 'close';      // 15-30%
  } else if (areaPercentage > 5) {
    return 'medium';     // 5-15%
  } else {
    return 'far';        // <5%
  }
};

/**
 * Calculate vertical position (high/middle/low)
 * Useful for detecting stairs, overhead objects, etc.
 */
export const calculateVerticalPosition = (
  bbox: BoundingBox,
  frameHeight: number
): 'high' | 'middle' | 'low' => {
  const objectCenterY = bbox.y + bbox.height / 2;
  
  const topBoundary = frameHeight * 0.33;
  const bottomBoundary = frameHeight * 0.67;
  
  if (objectCenterY < topBoundary) {
    return 'high';
  } else if (objectCenterY > bottomBoundary) {
    return 'low';
  } else {
    return 'middle';
  }
};

/**
 * Check if object is directly in path (centered + close)
 */
export const isInPath = (
  bbox: BoundingBox,
  frameWidth: number,
  frameHeight: number
): boolean => {
  const position = calculatePosition(bbox, frameWidth);
  const distance = estimateDistance(bbox, frameWidth, frameHeight);
  
  // Object is in path if it's centered and close
  return position === 'center' && (distance === 'close' || distance === 'very close');
};

/**
 * Get approximate distance in feet (very rough estimation)
 */
export const getApproximateDistanceFeet = (
  bbox: BoundingBox,
  frameHeight: number,
  objectClass: string
): number => {
  // This is a VERY rough estimation based on typical object heights
  const typicalHeights: { [key: string]: number } = {
    person: 5.5,      // feet
    car: 5,
    chair: 3,
    door: 7,
    table: 2.5,
  };
  
  const assumedHeight = typicalHeights[objectClass] || 4; // default 4 feet
  
  // Calculate distance using similar triangles
  // This is approximate and would need calibration for accuracy
  const objectHeightInPixels = bbox.height;
  const focalLength = frameHeight * 0.5; // Rough estimate
  
  const distance = (assumedHeight * focalLength) / objectHeightInPixels;
  
  return Math.round(distance);
};