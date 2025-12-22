import { Vibration } from 'react-native';

// Short alert vibration
export const vibrateAlert = () => {
  Vibration.vibrate(500); // 500 ms
};

// Strong alert (for obstacles)
export const vibrateObstacle = () => {
  Vibration.vibrate([0, 300, 200, 300]);
};
