import React from "react";

/**
 * RoutePreloader Component
 * Preloads route components on hover/focus to make transitions appear faster
 * @param {Function} lazyComponent - React lazy component
 * @param {Function} onPreload - Optional callback when preload happens
 */
export const withRoutePreloader = (lazyComponent, onPreload) => {
  let isPreloading = false;

  return {
    preload: () => {
      if (!isPreloading) {
        isPreloading = true;
        lazyComponent._result = lazyComponent._init?.().then(() => {
          onPreload?.();
          return lazyComponent._result;
        });
      }
    },
    component: lazyComponent,
  };
};

/**
 * PreloadLink Component
 * Link that preloads components on hover for faster navigation
 * @param {Object} props - React Router Link props
 * @param {Function} preloadFn - Function to call on hover
 */
function PreloadLink({ children, onHover, ...props }) {
  const handleMouseEnter = (e) => {
    if (onHover) {
      onHover();
    }
    props.onMouseEnter?.(e);
  };

  return (
    <a {...props} onMouseEnter={handleMouseEnter}>
      {children}
    </a>
  );
}

export default PreloadLink;
