// src/utils/positionCalculator.ts
import { Position, Distance } from '../types/detection.types';

/**
 * Calculate horizontal position of object relative to screen
 * COMPLETELY REWRITTEN - SIMPLE AND CORRECT
 */
export function calculatePosition(bbox: number[], frameWidth: number): Position {
  if (!bbox || bbox.length < 4) {
    console.error('❌ INVALID BBOX:', bbox);
    return 'center';
  }

  const x1 = bbox[0];
  const x2 = bbox[2];
  
  // Calculate the center point of the object
  const objectCenterX = (x1 + x2) / 2;
  
  // Divide screen width into 3 equal parts
  const oneThird = frameWidth / 3;
  const twoThirds = (frameWidth * 2) / 3;
  
  console.log('');
  console.log('═══════════════════════════════════════');
  console.log('🎯 POSITION CALCULATION:');
  console.log(`   Screen Width: ${frameWidth}px`);
  console.log(`   BBox X1: ${x1.toFixed(1)}, X2: ${x2.toFixed(1)}`);
  console.log(`   Object Center X: ${objectCenterX.toFixed(1)}px`);
  console.log(`   Zone Boundaries:`);
  console.log(`      LEFT zone:   0px to ${oneThird.toFixed(1)}px`);
  console.log(`      CENTER zone: ${oneThird.toFixed(1)}px to ${twoThirds.toFixed(1)}px`);
  console.log(`      RIGHT zone:  ${twoThirds.toFixed(1)}px to ${frameWidth}px`);
  
  let position: Position;
  
  // Simple logic: check which third of the screen the center falls in
  if (objectCenterX < oneThird) {
    position = 'left';
    console.log(`   ✅ POSITION = LEFT (${objectCenterX.toFixed(1)} < ${oneThird.toFixed(1)})`);
  } else if (objectCenterX > twoThirds) {
    position = 'right';
    console.log(`   ✅ POSITION = RIGHT (${objectCenterX.toFixed(1)} > ${twoThirds.toFixed(1)})`);
  } else {
    position = 'center';
    console.log(`   ✅ POSITION = CENTER (${oneThird.toFixed(1)} to ${twoThirds.toFixed(1)})`);
  }
  
  console.log('═══════════════════════════════════════');
  console.log('');
  
  return position;
}

/**
 * Estimate distance based on bounding box size
 */
export function estimateDistance(
  bbox: number[],
  frameWidth: number,
  frameHeight: number
): Distance {
  if (!bbox || bbox.length < 4) {
    console.error('❌ INVALID BBOX FOR DISTANCE:', bbox);
    return 'far';
  }

  const x1 = bbox[0];
  const y1 = bbox[1];
  const x2 = bbox[2];
  const y2 = bbox[3];
  
  const objectWidth = x2 - x1;
  const objectHeight = y2 - y1;
  
  const objectArea = objectWidth * objectHeight;
  const screenArea = frameWidth * frameHeight;
  const areaPercentage = (objectArea / screenArea) * 100;
  
  console.log('📏 DISTANCE CALCULATION:');
  console.log(`   Object Size: ${objectWidth.toFixed(1)}px × ${objectHeight.toFixed(1)}px`);
  console.log(`   Screen Size: ${frameWidth}px × ${frameHeight}px`);
  console.log(`   Object Area: ${objectArea.toFixed(0)} px²`);
  console.log(`   Screen Area: ${screenArea.toFixed(0)} px²`);
  console.log(`   Percentage: ${areaPercentage.toFixed(2)}%`);
  
  let distance: Distance;
  
  // Distance thresholds based on area percentage
  if (areaPercentage > 30) {
    distance = 'very close';
    console.log(`   ✅ VERY CLOSE (area > 30%)`);
  } else if (areaPercentage > 15) {
    distance = 'close';
    console.log(`   ✅ CLOSE (area > 15%)`);
  } else if (areaPercentage > 5) {
    distance = 'medium';
    console.log(`   ✅ MEDIUM (area > 5%)`);
  } else {
    distance = 'far';
    console.log(`   ✅ FAR (area <= 5%)`);
  }
  
  return distance;
}

/**
 * Check if object is in direct path (center 20% of screen)
 */
export function isInDirectPath(bbox: number[], frameWidth: number): boolean {
  if (!bbox || bbox.length < 4) {
    return false;
  }

  const x1 = bbox[0];
  const x2 = bbox[2];
  const objectCenterX = (x1 + x2) / 2;
  
  // Direct path is center 20% of screen (40% to 60%)
  const directPathStart = frameWidth * 0.40;
  const directPathEnd = frameWidth * 0.60;
  
  return objectCenterX >= directPathStart && objectCenterX <= directPathEnd;
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
  
  // Distance is most important (0-100 points)
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
  
  // Position matters (0-40 points)
  switch (position) {
    case 'center':
      score += 40;
      break;
    case 'left':
    case 'right':
      score += 20;
      break;
  }
  
  // Confidence adds small boost (0-15 points)
  score += confidence * 15;
  
  return score;
}

/**
 * Get textual location description
 */
export function getLocationDescription(
  position: Position,
  distance: Distance
): string {
  const positionText = {
    'left': 'on your left',
    'center': 'directly ahead',
    'right': 'on your right'
  }[position];

  const distanceText = {
    'very close': 'very close',
    'close': 'close by',
    'medium': 'at medium distance',
    'far': 'far away'
  }[distance];

  return `${positionText}, ${distanceText}`;
}