import type { PictureInPictureViewProps } from './types';
import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import PictureInPictureView from './PictureInPictureView';

type PictureInPictureManagerProps = {
  pipProps: PictureInPictureViewProps;
  children?: React.ReactNode;
};

type PipManagerContextValue = {
  activeView: null | React.ReactNode;
  setActiveView: React.Dispatch<React.SetStateAction<null>>;
};

export const PipManagerContext = React.createContext<PipManagerContextValue>({
  activeView: null,
  setActiveView: () => {},
});
PipManagerContext.displayName = 'PipManagerContext';

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});

function PictureInPictureManager({
  pipProps,
  children,
}: PictureInPictureManagerProps) {
  const [activeView, setActiveView] = useState(null);

  const ctxValue = useMemo(
    () => ({
      activeView,
      setActiveView,
    }),
    [activeView]
  );

  const onDestroy = useCallback(() => setActiveView(null), []);

  return (
    <PipManagerContext.Provider value={ctxValue}>
      <View style={styles.flex}>
        {children}
        {activeView !== null && (
          <PictureInPictureView {...pipProps} onDestroy={onDestroy}>
            {activeView}
          </PictureInPictureView>
        )}
      </View>
    </PipManagerContext.Provider>
  );
}

export default PictureInPictureManager;
