import { useState, useEffect, useCallback } from "react";

import { Direction } from "@/reducer/2048";

// Define the threshold for detecting a swipe gesture
const SWIPE_THRESHOLD = 50; // Minimum distance in pixels to be considered a swipe

const useSwipe = (cb: (dir: Direction) => void) => {
  const [swipeDirection, setSwipeDirection] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(
    null,
  );

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  }, []);

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!touchStart) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStart.x;
      const deltaY = touch.clientY - touchStart.y;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absX > SWIPE_THRESHOLD || absY > SWIPE_THRESHOLD) {
        if (absX > absY) {
          if (deltaX > 0) {
            setSwipeDirection("right");
            cb("right");
          } else {
            setSwipeDirection("left");
            cb("left");
          }
        } else {
          if (deltaY > 0) {
            setSwipeDirection("down");
            cb("down");
          } else {
            setSwipeDirection("up");
            cb("up");
          }
        }
      }

      setTouchStart(null);
    },
    [touchStart, cb],
  );

  useEffect(() => {
    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);

  return swipeDirection;
};

export default useSwipe;

export const useDisableScroll = (disable: boolean) => {
  useEffect(() => {
    if (disable) {
      // Disable scrolling
      document.body.style.overflow = "hidden";
      document.addEventListener("touchmove", preventDefault, {
        passive: false,
      });
    } else {
      // Re-enable scrolling
      document.body.style.overflow = "";
      document.removeEventListener("touchmove", preventDefault);
    }

    // Cleanup on unmount or when disable changes
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("touchmove", preventDefault);
    };
  }, [disable]);

  const preventDefault = (e: TouchEvent) => {
    e.preventDefault();
  };
};
