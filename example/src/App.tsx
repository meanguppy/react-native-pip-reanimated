import React, { useCallback, useState } from 'react';
import { Button, StyleSheet, SafeAreaView, Image } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PictureInPictureView } from 'react-native-pip-reanimated';
import ExampleProps from './exampleProps';
import img from '../image.jpg';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'white',
  },
  background: {
    flex: 1,
    zIndex: 0,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

function App() {
  const [destroyed, setDestroyed] = useState(false);
  const onDestroy = useCallback(() => setDestroyed(true), []);
  const reset = useCallback(() => {
    setDestroyed(true);
    setTimeout(() => setDestroyed(false));
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaView style={styles.background}>
        <Button title="Reset player" onPress={reset} />
      </SafeAreaView>
      {!destroyed && (
        <PictureInPictureView {...ExampleProps} onDestroy={onDestroy}>
          <Image style={styles.image} source={img} />
        </PictureInPictureView>
      )}
    </GestureHandlerRootView>
  );
}

export default App;
