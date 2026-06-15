/**
 * Performance Optimization Utilities
 * Includes lazy loading, prefetching, and resource optimization strategies
 */

/**
 * Preload a route component before navigation
 * Useful for anticipating user navigation patterns
 * @param {Function} lazyComponent - React lazy component
 */
export const preloadComponent = (lazyComponent) => {
    const component = lazyComponent;
    if (component && component._result) {
        return component._result;
    }
};

/**
 * Prefetch resources for smoother transitions
 * @param {string} url - Resource URL to prefetch
 */
export const prefetchResource = (url) => {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = url;
    document.head.appendChild(link);
};

/**
 * Lazy load images with Intersection Observer
 * @param {string} selector - CSS selector for images
 */
export const lazyLoadImages = (selector = "[data-src]") => {
    const images = document.querySelectorAll(selector);

    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.add("lazy-loaded");
                observer.unobserve(img);
            }
        });
    });

    images.forEach((img) => imageObserver.observe(img));
};

/**
 * Request idle callback wrapper with fallback
 * Schedules work to happen during browser idle time
 * @param {Function} callback - Function to execute
 */
export const scheduleIdleTask = (callback) => {
    if ("requestIdleCallback" in window) {
        requestIdleCallback(callback);
    } else {
        setTimeout(callback, 1);
    }
};

/**
 * Batch DOM updates to prevent layout thrashing
 * @param {Function} updateFn - Function containing DOM updates
 */
export const batchDOMUpdates = (updateFn) => {
    scheduleIdleTask(() => {
        requestAnimationFrame(updateFn);
    });
};

/**
 * Monitor performance metrics
 * @returns {Object} Performance metrics including FCP, LCP, CLS
 */
export const monitorPerformance = () => {
    const metrics = {};

    if ("PerformanceObserver" in window) {
        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
        });
        lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });

        // Cumulative Layout Shift
        const clsObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            let cls = 0;
            entries.forEach((entry) => {
                if (!entry.hadRecentInput) {
                    cls += entry.value;
                }
            });
            metrics.cls = cls;
        });
        clsObserver.observe({ entryTypes: ["layout-shift"] });
    }

    // Navigation Timing
    window.addEventListener("load", () => {
        const perfData = window.performance.timing;
        metrics.pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        metrics.connectTime = perfData.responseEnd - perfData.requestStart;
        metrics.renderTime = perfData.domInteractive - perfData.domLoading;
    });

    return metrics;
};

/**
 * Optimize resource hints based on connection speed
 */
export const optimizeResourceHints = () => {
    const connection = navigator.connection;

    if (connection) {
        const effectiveType = connection.effectiveType;

        // Reduce prefetching on slower connections
        if (effectiveType === "4g") {
            // Aggressive prefetching on fast networks
            prefetchResource("/src/pages/Generator.jsx");
            prefetchResource("/src/pages/Contributors.jsx");
        } else if (effectiveType === "3g") {
            // Conservative prefetching on slower networks
            prefetchResource("/src/pages/Generator.jsx");
        }
    }
};

export default {
    preloadComponent,
    prefetchResource,
    lazyLoadImages,
    scheduleIdleTask,
    batchDOMUpdates,
    monitorPerformance,
    optimizeResourceHints,
};
