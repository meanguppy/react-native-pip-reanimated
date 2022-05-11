const style = {
    width: '66%',
    backgroundColor: 'transparent',
    aspectRatio: 16 / 9,
    zIndex: 1000,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.33,
    shadowRadius: 5,
    shadowOffset: {
        width: 0,
        height: 3,
    },
    borderRadius: 12,
    overflow: 'hidden',
};
const VERTICAL_CONFIG = {
    margin: 8,
    spring: {
        stiffness: 600,
        damping: 15,
        mass: 0.2,
    },
    resistance: 0.8,
};
const HORIZONTAL_CONFIG = {
    margin: 8,
    spring: {
        stiffness: 500,
        damping: 40,
        mass: 0.8,
    },
    destroyByFling: {
        minimumVelocity: 2400,
        maximumAngle: 30 * (Math.PI / 180),
        lockAxis: true,
        fadeDuration: 200,
    },
    destroyByDrag: {
        minimumOutOfBounds: 0.5,
        animateVelocity: 1000,
    },
};
const props = {
    style,
    edgeConfig: {
        top: VERTICAL_CONFIG,
        bottom: VERTICAL_CONFIG,
        left: HORIZONTAL_CONFIG,
        right: HORIZONTAL_CONFIG,
    },
    initialX: 10,
    initialY: 10,
    deceleration: 0.985,
    minimumGlideVelocity: 120,
    scaleDuringDrag: 1.02,
    destroyOverlayColor: 'rgba(255,0,0,0.5)',
    onDestroy: () => { },
};
export default props;
