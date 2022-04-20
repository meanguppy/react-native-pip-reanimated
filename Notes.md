## Customizing overview

### Props
```javascript
  // if the view was flung with some velocity, let it glide
  minimumGlideVelocity: number;

  // determines how much the view can glide
  deceleration: number;

  // if using dragToDestroy, set an overlay color to display when the view
  // is far enough out-of-bounds to be destroyed (optional)
  destroyOverlayColor: string;

  // separate configuration for each edge, see below.
  edgeConfig: {
    top: EdgeConfig;
    bottom: EdgeConfig;
    left: EdgeConfig;
    right: EdgeConfig;
  }
```

### Edge config (top, bottom, left, right)
```javascript
  // px from edge that the view likes to sit at
  margin: number;

  // spring params to bounce the view back into bounds with if not destroying
  spring?: WithSpringConfig;

  // prevent the view from being dragged off-screen, if destroyByDrag is not desired
  // 0.8 means 80% of the view will still be on-screen when it would otherwise be 100% off-screen
  resistEdge?: number;

  // enable destroying the view by flinging
  destroyByFling?: {

    // the minimum required velocity to destroy the view
    velocity: number;

    // the maximum angle (in radians oriented towards the edge) allowed to destroy the view.
    // for example, if the user flings the view at 75 degrees (in unit circle), we can prevent
    // the view from being destroyed on the right edge by lowering the maximum angle.
    // in other words: _how_ perpendicular the fling direction must be to the edge.
    angle: number;

    // once destroying has begun, fade out the view over this duration
    fadeDuration: number;

    // when animating the fling, optionally lock the animation to one axis
    lockAxis?: boolean;
  };

  // enable destroying the view by dragging off-screen
  destroyByDrag?: {

    // minimum percent of view that must be off-screen to destroy upon releasing the drag
    oobPercent: number;

    // the velocity at which to animate the view when released
    velocity: number;
  };
```
