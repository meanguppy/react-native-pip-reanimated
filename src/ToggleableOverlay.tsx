import React, { useCallback, useRef } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import {
  Gesture,
  GestureDetector,
  TouchableWithoutFeedback,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type ToggleableOverlayProps = {
  fadeDelay?: number;
  fadeDuration?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

const styles = StyleSheet.create({
  touchable: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  overlay: {
    width: '100%',
    height: '100%',
  },
});

function ToggleableOverlay({
  fadeDelay = 2500,
  fadeDuration = 150,
  style,
  children,
}: ToggleableOverlayProps) {
  const opacity = useSharedValue(0);
  const timeout = useRef<null | NodeJS.Timeout>(null);

  /* Clear the fade timeout, and refresh if necessary */
  const handleTimeout = useCallback(
    (shouldRefresh) => {
      if (timeout.current !== null) {
        clearTimeout(timeout.current);
        timeout.current = null;
      }
      if (shouldRefresh) {
        timeout.current = setTimeout(() => {
          opacity.value = 0;
        }, fadeDelay);
      }
    },
    [timeout, opacity, fadeDelay]
  );

  const toggleOverlay = useCallback(() => {
    const newOpacity = opacity.value === 1 ? 0 : 1;
    opacity.value = newOpacity;
    handleTimeout(newOpacity === 1);
  }, [opacity, handleTimeout]);

  /* Gesture to spy on any taps on their way through the overlay.
     Will refresh the fade timeout when the overlay is already open. */
  const spy = Gesture.Manual()
    .runOnJS(true)
    .onTouchesUp(() => {
      handleTimeout(opacity.value === 1);
    });

  const stylez = useAnimatedStyle(() => ({
    opacity: withTiming(opacity.value, { duration: fadeDuration }),
  }));

  return (
    <GestureDetector gesture={spy}>
      <TouchableWithoutFeedback
        containerStyle={styles.touchable}
        onPress={toggleOverlay}
      >
        <Animated.View style={[styles.overlay, stylez, style]}>
          {children}
        </Animated.View>
      </TouchableWithoutFeedback>
    </GestureDetector>
  );
}

ToggleableOverlay.defaultProps = {
  fadeDelay: 2500,
  fadeDuration: 150,
};

export default ToggleableOverlay;
