import React, { useCallback, useRef, useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import {
  Gesture,
  GestureDetector,
  TouchableWithoutFeedback,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

type ToggleableOverlayProps = {
  fadeDelay?: number;
  fadeDuration?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

const styles = StyleSheet.create({
  absolute: {
    position: 'absolute',
  },
  full: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
});

function ToggleableOverlay({
  fadeDelay = 2500,
  fadeDuration = 150,
  style,
  children,
}: ToggleableOverlayProps) {
  const [hidden, setHidden] = useState(true);
  const timeout = useRef<null | NodeJS.Timeout>(null);

  /* Clear the fade timeout, and refresh if necessary */
  const handleTimeout = useCallback(
    (shouldRefresh) => {
      if (timeout.current !== null) {
        clearTimeout(timeout.current);
        timeout.current = null;
      }
      if (shouldRefresh) {
        timeout.current = setTimeout(() => setHidden(true), fadeDelay);
      }
    },
    [timeout, fadeDelay]
  );

  const toggleOverlay = useCallback(() => {
    setHidden(!hidden);
    handleTimeout(hidden);
  }, [hidden, handleTimeout]);

  /* Gesture to spy on any taps on their way through the overlay.
     Will refresh the fade timeout when the overlay is already open. */
  const spy = Gesture.Manual().onTouchesUp((_, manager) => {
    manager.fail();
    if (!hidden) runOnJS(handleTimeout)(true);
  });

  const stylez = useAnimatedStyle(
    () => ({
      opacity: withTiming(hidden ? 0 : 1, { duration: fadeDuration }),
    }),
    [hidden, fadeDuration]
  );

  return (
    <GestureDetector gesture={spy}>
      <View style={[styles.absolute, styles.full]}>
        <TouchableWithoutFeedback onPress={toggleOverlay}>
          <View collapsable={false} style={styles.full}>
            <Animated.View
              pointerEvents={hidden ? 'none' : 'auto'}
              style={[style, stylez]}
            >
              {children}
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </GestureDetector>
  );
}

ToggleableOverlay.defaultProps = {
  fadeDelay: 2500,
  fadeDuration: 150,
};

export default ToggleableOverlay;
