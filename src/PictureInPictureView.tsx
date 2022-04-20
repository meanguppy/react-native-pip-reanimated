import React, { useCallback } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  withDecay,
  withSpring,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  useAnimatedReaction,
  useSharedValue,
  useDerivedValue,
  withTiming,
  runOnJS,
  WithSpringConfig,
} from 'react-native-reanimated';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';

type EdgeName = 'top' | 'bottom' | 'left' | 'right';

type EdgeConfig = {
  margin: number;
  spring?: WithSpringConfig;
  resistEdge?: number;
  destroyByFling?: {
    velocity: number;
    angle: number;
    fadeDuration: number;
    lockAxis?: boolean;
  };
  destroyByDrag?: {
    oobPercent: number;
    velocity: number;
  };
};

type GestureContext = {
  startX: number;
  startY: number;
};

type PictureInPictureViewProps = {
  edgeConfig: {
    top: EdgeConfig;
    bottom: EdgeConfig;
    left: EdgeConfig;
    right: EdgeConfig;
  };
  initialX: number;
  initialY: number;
  deceleration: number;
  minimumGlideVelocity: number;
  destroyOverlayColor: string;
  onDestroy: () => void;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 1000,
  },
});

function PictureInPictureView({
  edgeConfig,
  initialX,
  initialY,
  deceleration,
  minimumGlideVelocity,
  destroyOverlayColor,
  onDestroy,
  style,
  children,
}: PictureInPictureViewProps) {
  const dragging = useSharedValue(false);
  const destroying = useSharedValue(false);
  const translateX = useSharedValue(initialX);
  const translateY = useSharedValue(initialY);
  const fadeOpacity = useSharedValue(1.0);
  const boxWidth = useSharedValue(0);
  const boxHeight = useSharedValue(0);
  const viewWidth = useSharedValue(Infinity);
  const viewHeight = useSharedValue(Infinity);

  /* Calculate percent of box that is outside each boundary */
  const oobPercentages = useDerivedValue(() => ({
    top: -translateY.value / boxHeight.value,
    right:
      (translateX.value + boxWidth.value - viewWidth.value) / boxWidth.value,
    bottom:
      (translateY.value + boxHeight.value - viewHeight.value) / boxHeight.value,
    left: -translateX.value / boxWidth.value,
  }));

  /* Fade box opacity when drag-to-destroy is enabled on that edge */
  const opacity = useDerivedValue(() => {
    const { top, right, bottom, left } = oobPercentages.value;
    const max = Math.max(
      0,
      edgeConfig.top.destroyByDrag ? top : 0,
      edgeConfig.bottom.destroyByDrag ? bottom : 0,
      edgeConfig.left.destroyByDrag ? left : 0,
      edgeConfig.right.destroyByDrag ? right : 0
    );
    return Math.min(fadeOpacity.value, 1 - max * 0.8);
  });

  /* Track whether the box is ready for drag-to-destroy */
  const releaseWillDestroy = useDerivedValue(() => {
    function canDestroyByDrag(edge: EdgeName) {
      const { destroyByDrag } = edgeConfig[edge];
      const oob = oobPercentages.value[edge];
      if (destroyByDrag && destroyByDrag.oobPercent <= oob) {
        const axis = edge === 'top' || edge === 'bottom' ? 'y' : 'x';
        const dir = edge === 'right' || edge === 'bottom' ? 1 : -1;
        return {
          axis,
          velocity: destroyByDrag.velocity * dir,
        };
      }
      return null;
    }
    return (
      canDestroyByDrag('left') ||
      canDestroyByDrag('right') ||
      canDestroyByDrag('top') ||
      canDestroyByDrag('bottom')
    );
  });

  /* Call onDestroy when opacity hits zero */
  useAnimatedReaction(
    () => opacity.value,
    (val, prev) => {
      if (destroying.value && val <= 0 && !!prev) {
        runOnJS(onDestroy)();
      }
    }
  );

  /* Bounce back with spring when box is outside margins */
  useAnimatedReaction(
    () => !dragging.value && !destroying.value && oobPercentages.value,
    (oob) => {
      if (!oob) return;
      const { top, bottom, left, right } = edgeConfig;
      if (oob.top > -top.margin / boxHeight.value) {
        translateY.value = withSpring(top.margin, top.spring);
      } else if (oob.bottom > -bottom.margin / boxHeight.value) {
        translateY.value = withSpring(
          viewHeight.value - boxHeight.value - bottom.margin,
          bottom.spring
        );
      }
      if (oob.left > -left.margin / boxWidth.value) {
        translateX.value = withSpring(left.margin, left.spring);
      } else if (oob.right > -right.margin / boxWidth.value) {
        translateX.value = withSpring(
          viewWidth.value - boxWidth.value - right.margin,
          right.spring
        );
      }
    }
  );

  const gestureHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    GestureContext
  >({
    onStart: (_, ctx) => {
      dragging.value = true;
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx) => {
      translateX.value = ctx.startX + event.translationX;
      translateY.value = ctx.startY + event.translationY;
    },
    onEnd: (event, _) => {
      const { velocityX: vx, velocityY: vy } = event;
      const v = Math.sqrt(vx * vx + vy * vy);
      const angle = Math.atan(Math.abs(vy) / Math.abs(vx));
      /* Handle destroy if flinging with correct velocity and angle */
      function canDestroyByFling(edge: EdgeName, orientedAngle: Number) {
        const { destroyByFling } = edgeConfig[edge];
        if (
          destroyByFling &&
          destroyByFling.velocity <= v &&
          destroyByFling.angle >= orientedAngle
        ) {
          return {
            axis: destroyByFling.lockAxis
              ? [edge === 'top' || edge === 'bottom' ? 'y' : 'x']
              : ['x', 'y'],
            fadeDuration: destroyByFling.fadeDuration,
          };
        }
        return null;
      }
      const destroyByFling =
        (vx > 0 && canDestroyByFling('left', angle)) ||
        (vx < 0 && canDestroyByFling('right', angle)) ||
        (vy < 0 && canDestroyByFling('top', Math.PI / 2 - angle)) ||
        (vy > 0 && canDestroyByFling('bottom', Math.PI / 2 - angle));
      if (destroyByFling) {
        destroying.value = true;
        if (destroyByFling.axis.includes('x'))
          translateX.value = withDecay({ velocity: vx, deceleration: 1 });
        if (destroyByFling.axis.includes('y'))
          translateY.value = withDecay({ velocity: vy, deceleration: 1 });
        if (destroyByFling.fadeDuration !== undefined)
          fadeOpacity.value = withTiming(0, {
            duration: destroyByFling.fadeDuration,
          });
        return;
      }

      /* Handle destroy if dragging out of bounds */
      if (releaseWillDestroy.value) {
        destroying.value = true;
        const slideAway = withDecay({
          velocity: releaseWillDestroy.value.velocity,
          deceleration: 1,
        });
        if (releaseWillDestroy.value.axis === 'x') {
          translateX.value = slideAway;
        } else {
          translateY.value = slideAway;
        }
        return;
      }

      /* Otherwise, allow box to glide along screen */
      if (Math.abs(vx) > minimumGlideVelocity) {
        translateX.value = withDecay({
          velocity: vx,
          deceleration,
        });
      }
      if (Math.abs(vy) > minimumGlideVelocity) {
        translateY.value = withDecay({
          velocity: vy,
          deceleration,
        });
      }
    },
    onFinish: () => {
      dragging.value = false;
    },
  });

  const stylez = useAnimatedStyle(() => {
    let x = translateX.value;
    let y = translateY.value;
    /* Resist edges, prevent box going entirely off-screen */
    const { top, bottom, left, right } = oobPercentages.value;
    const resistTop = edgeConfig.top.resistEdge;
    const resistBottom = edgeConfig.bottom.resistEdge;
    const resistLeft = edgeConfig.left.resistEdge;
    const resistRight = edgeConfig.right.resistEdge;
    const bh = boxHeight.value;
    const bw = boxWidth.value;
    if (resistTop && top > 0) {
      y = Math.max(y, -bh * (1 - Math.pow(resistTop, Math.min(top, 1))));
    } else if (resistBottom && bottom > 0) {
      y = Math.min(
        y,
        y + bh * (1 - Math.pow(resistBottom, Math.min(bottom, 1)) - bottom)
      );
    }
    if (resistLeft && left > 0) {
      x = Math.max(x, -bw * (1 - Math.pow(resistLeft, Math.min(left, 1))));
    } else if (resistRight && right > 0) {
      x = Math.min(
        x,
        x + bw * (1 - Math.pow(resistRight, Math.min(right, 1)) - right)
      );
    }
    return {
      opacity: opacity.value,
      transform: [
        //{ translateX: -boxWidth.value / 2 },
        //{ translateY: -boxHeight.value / 2 },
        //{ scale: withTiming(dragging.value ? 1.025 : 1.0, {
        //    duration: 100,
        //  }),
        //},
        { translateX: x },
        { translateY: y },
      ],
    };
  });

  const overlayOpacity = useAnimatedStyle(() => ({
    opacity: withTiming(releaseWillDestroy.value ? 1 : 0, { duration: 200 }),
  }));

  const onLayoutBox = useCallback(
    (evt) => {
      const { width, height } = evt.nativeEvent.layout;
      boxWidth.value = width;
      boxHeight.value = height;
    },
    [boxWidth, boxHeight]
  );

  const onLayoutView = useCallback(
    (evt) => {
      const { width, height } = evt.nativeEvent.layout;
      viewWidth.value = width;
      viewHeight.value = height;
    },
    [viewWidth, viewHeight]
  );

  return (
    <View
      pointerEvents="box-none"
      style={styles.overlay}
      onLayout={onLayoutView}
    >
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View onLayout={onLayoutBox} style={[style, stylez]}>
          {children}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.overlay,
              { backgroundColor: destroyOverlayColor },
              overlayOpacity,
            ]}
          />
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

PictureInPictureView.defaultProps = {
  initialX: 0,
  initialY: 0,
  deceleration: 0.985,
  minimumGlideVelocity: 120,
  onDestroy: () => {},
};

export default PictureInPictureView;
