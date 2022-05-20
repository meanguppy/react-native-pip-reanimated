import type { PictureInPictureViewProps } from './types';
import React, { useState, useCallback, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import PictureInPictureView from './PictureInPictureView';

type PictureInPictureContextValue = {
  sharedData: React.MutableRefObject<undefined>;
  setActiveView: Function;
  setOnDestroy: Function;
};

export const PictureInPictureContext =
  React.createContext<PictureInPictureContextValue>({
    sharedData: { current: undefined },
    setActiveView: () => {},
    setOnDestroy: () => {},
  });
PictureInPictureContext.displayName = 'PictureInPictureContext';

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});

function PictureInPictureManager({
  children,
  ...rest
}: PictureInPictureViewProps) {
  const sharedData = useRef();
  const [activeView, setActiveView] = useState(null);
  const [onDestroy, setOnDestroy] = useState<Function | null>(null);

  const ctxValue = useMemo(
    () => ({
      sharedData,
      setActiveView,
      setOnDestroy,
    }),
    []
  );

  const handleDestroy = useCallback(() => {
    if (typeof onDestroy === 'function') onDestroy();
    setActiveView(null);
  }, [onDestroy]);

  return (
    <PictureInPictureContext.Provider value={ctxValue}>
      <View style={styles.flex}>
        <>
          {children}
          {activeView !== null && (
            <PictureInPictureView {...rest} onDestroy={handleDestroy}>
              {activeView}
            </PictureInPictureView>
          )}
        </>
      </View>
    </PictureInPictureContext.Provider>
  );
}

export default PictureInPictureManager;
