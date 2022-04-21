import type { StyleProp, ViewStyle } from 'react-native';
import type { WithSpringConfig } from 'react-native-reanimated';

export type EdgeName = 'top' | 'bottom' | 'left' | 'right';

export type EdgeConfig = {
  margin: number;
  spring?: WithSpringConfig;
  resistance?: number;
  destroyByFling?: {
    minimumVelocity: number;
    maximumAngle: number;
    fadeDuration: number;
    lockAxis?: boolean;
  };
  destroyByDrag?: {
    minimumOutOfBounds: number;
    animateVelocity: number;
  };
};

export type PictureInPictureViewProps = {
  edgeConfig: {
    top: EdgeConfig;
    bottom: EdgeConfig;
    left: EdgeConfig;
    right: EdgeConfig;
  };
  initialX?: number;
  initialY?: number;
  deceleration?: number;
  minimumGlideVelocity?: number;
  scaleDuringDrag?: number;
  destroyOverlayColor?: string;
  onDestroy: () => void;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};