import React, { useCallback, useState } from 'react';
import { Button, StyleSheet, SafeAreaView, Image, View } from 'react-native';
import {
  GestureHandlerRootView,
  TouchableOpacity,
} from 'react-native-gesture-handler';
import {
  PictureInPictureView,
  ToggleableOverlay,
} from 'react-native-pip-reanimated';
import ExampleProps from './exampleProps';
import img from '../image.jpg';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'gray',
  },
  background: {
    flex: 1,
    zIndex: 0,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  center: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  button: {
    width: 48,
    height: 48,
    backgroundColor: 'white',
  },
});

function ButtonControls() {
  return (
    <TouchableOpacity
      activeOpacity={0.6}
      onPress={() => console.log('BUTTON', Date.now())}
    >
      <View style={styles.button} />
    </TouchableOpacity>
  );
}

function App() {
  const [destroyed, setDestroyed] = useState(false);
  const [persist, setPersist] = useState(false);
  const onDestroy = useCallback(() => setDestroyed(true), []);
  const reset = useCallback(() => {
    setDestroyed(true);
    setTimeout(() => setDestroyed(false));
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaView style={styles.background}>
        <Button title="Reset player" onPress={reset} />
        <Button
          title={`Persist ${persist}`}
          onPress={() => setPersist(!persist)}
        />
      </SafeAreaView>
      {!destroyed && (
        <PictureInPictureView {...ExampleProps} onDestroy={onDestroy}>
          <Image style={styles.image} source={img} />
          <ToggleableOverlay persist={persist} style={styles.center}>
            <ButtonControls />
          </ToggleableOverlay>
        </PictureInPictureView>
      )}
    </GestureHandlerRootView>
  );
}

export default App;
