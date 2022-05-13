import React, { useCallback } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
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
  Easing,
} from 'react-native-reanimated';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import type { PictureInPictureViewProps, EdgeName } from './types';

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 1000,
  },
});

const DEFAULT_OVERLAY_COLOR = 'rgba(255,0,0,0.5)';

function PictureInPictureView({
  edgeConfig,
  initialX = 0,
  initialY = 0,
  deceleration = 0.985,
  minimumGlideVelocity = 120,
  scaleDuringDrag = 1.02,
  destroyOverlayColor = DEFAULT_OVERLAY_COLOR,
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

  /* Calculate percent of box that is outside each edge */
  function calcOutOfBoundsWith(x: number, y: number) {
    'worklet';
    return {
      top: -y / boxHeight.value,
      right: (x + boxWidth.value - viewWidth.value) / boxWidth.value,
      bottom: (y + boxHeight.value - viewHeight.value) / boxHeight.value,
      left: -x / boxWidth.value,
    };
  }

  const outOfBounds = useDerivedValue(() => {
    'worklet';
    return calcOutOfBoundsWith(translateX.value, translateY.value);
  });

  /* Track whether the box is ready for drag-to-destroy */
  const releaseWillDestroy = useDerivedValue(() => {
    'worklet';
    function canDestroyByDrag(edge: EdgeName) {
      const { destroyByDrag } = edgeConfig[edge];
      const oob = outOfBounds.value[edge];
      if (destroyByDrag && destroyByDrag.minimumOutOfBounds <= oob) {
        const axis = edge === 'top' || edge === 'bottom' ? 'y' : 'x';
        const dir = edge === 'right' || edge === 'bottom' ? 1 : -1;
        return {
          axis,
          velocity: destroyByDrag.animateVelocity * dir,
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

  /* Fade box opacity when drag-to-destroy is enabled on that edge */
  const opacity = useDerivedValue(() => {
    'worklet';
    const { top, right, bottom, left } = outOfBounds.value;
    const max = Math.max(
      0,
      edgeConfig.top.destroyByDrag ? top : 0,
      edgeConfig.bottom.destroyByDrag ? bottom : 0,
      edgeConfig.left.destroyByDrag ? left : 0,
      edgeConfig.right.destroyByDrag ? right : 0
    );
    return Math.min(fadeOpacity.value, 1 - max * 0.8);
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
    () => !dragging.value && !destroying.value && outOfBounds.value,
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
    { startX: number; startY: number }
  >({
    onStart: (_, ctx) => {
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx) => {
      dragging.value = true;
      let x = ctx.startX + event.translationX;
      let y = ctx.startY + event.translationY;
      /* Resist edges, prevent box from being dragged off-screen */
      const { top, bottom, left, right } = calcOutOfBoundsWith(x, y);
      const resistTop = edgeConfig.top.resistance;
      const resistBottom = edgeConfig.bottom.resistance;
      const resistLeft = edgeConfig.left.resistance;
      const resistRight = edgeConfig.right.resistance;
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
      translateX.value = x;
      translateY.value = y;
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
          destroyByFling.minimumVelocity <= v &&
          destroyByFling.maximumAngle >= orientedAngle
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
        (vx < 0 && canDestroyByFling('left', angle)) ||
        (vx > 0 && canDestroyByFling('right', angle)) ||
        (vy < 0 && canDestroyByFling('top', Math.PI / 2 - angle)) ||
        (vy > 0 && canDestroyByFling('bottom', Math.PI / 2 - angle));
      if (destroyByFling) {
        destroying.value = true;
        if (destroyByFling.axis.includes('x'))
          translateX.value = withDecay({ velocity: vx, deceleration: 1 });
        if (destroyByFling.axis.includes('y'))
          translateY.value = withDecay({ velocity: vy, deceleration: 1 });
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
    const scale = scaleDuringDrag && dragging.value ? scaleDuringDrag : 1;
    return {
      top: translateY.value,
      left: translateX.value,
      opacity: opacity.value,
      transform: [
        {
          scale: withTiming(scale, {
            duration: 120,
            easing: Easing.bezier(0, 0, 0.1, 1),
          }),
        },
      ],
    };
  });

  const overlayOpacity = useAnimatedStyle(() => ({
    opacity: withTiming(releaseWillDestroy.value ? 1 : 0, { duration: 180 }),
  }));

  const onLayoutBox = useCallback(
    (evt: LayoutChangeEvent) => {
      const { width, height } = evt.nativeEvent.layout;
      boxWidth.value = width;
      boxHeight.value = height;
    },
    [boxWidth, boxHeight]
  );

  const onLayoutView = useCallback(
    (evt: LayoutChangeEvent) => {
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
      {/* @ts-ignore:next-line: children prop should exist */}
      <PanGestureHandler minDist={5} onGestureEvent={gestureHandler}>
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
  scaleDuringDrag: 1.02,
  destroyOverlayColor: DEFAULT_OVERLAY_COLOR,
  onDestroy: () => {},
};

export default PictureInPictureView;
