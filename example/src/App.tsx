import React, { useCallback, useState } from 'react';
import { Button, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PictureInPictureView } from 'react-native-pip-reanimated';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'orange',
  },
  background: {
    flex: 1,
    zIndex: 0,
  },
  floating: {
    width: '66%',
    backgroundColor: 'white',
    aspectRatio: 16 / 9,
    zIndex: 1000,
  },
});

const SPRING_SOFT = {
  stiffness: 500,
  damping: 40,
  mass: 0.8,
};

const SPRING_HARD = {
  stiffness: 500,
  damping: 15,
  mass: 0.2,
};

const VERTICAL_CONFIG = {
  margin: 4,
  spring: SPRING_HARD,
  resistEdge: 0.8,
};

const HORIZONTAL_CONFIG = {
  margin: 4,
  spring: SPRING_SOFT,
  destroyByFling: {
    velocity: 2500,
    angle: 25 * (Math.PI / 180),
    lockAxis: true,
    fadeDuration: 200,
  },
  destroyByDrag: {
    oobPercent: 0.5,
    velocity: 1000,
  },
};

const EDGE_CONFIG = {
  top: VERTICAL_CONFIG,
  bottom: VERTICAL_CONFIG,
  left: HORIZONTAL_CONFIG,
  right: HORIZONTAL_CONFIG,
};

function App() {
  const [destroyed, setDestroyed] = useState(false);

  const onDestroy = useCallback(() => {
    setDestroyed(true);
  }, []);
  const reset = useCallback(() => {
    setDestroyed(true);
    setTimeout(() => setDestroyed(false));
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.background}>
        <Button title="Reset player" onPress={reset} />
      </View>
      {!destroyed && (
        <PictureInPictureView
          edgeConfig={EDGE_CONFIG}
          initialX={10}
          initialY={10}
          minimumGlideVelocity={120}
          destroyOverlayColor="rgba(255,0,0,0.5)"
          deceleration={0.985}
          onDestroy={onDestroy}
          style={styles.floating}
        />
      )}
    </GestureHandlerRootView>
  );
}

export default App;
