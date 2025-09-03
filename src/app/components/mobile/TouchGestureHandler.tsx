'use client';

import React, { useEffect, useRef, useState } from 'react';
import { mobileOptimizer } from '@/lib/mobile/mobileOptimizer';

interface TouchGestureHandlerProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onLongPress?: () => void;
  onDoubleTap?: () => void;
  onPinch?: (scale: number) => void;
  onPan?: (deltaX: number, deltaY: number) => void;
  swipeThreshold?: number;
  longPressDelay?: number;
  doubleTapDelay?: number;
  enableHapticFeedback?: boolean;
  className?: string;
}

export default function TouchGestureHandler({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onLongPress,
  onDoubleTap,
  onPinch,
  onPan,
  swipeThreshold = 50,
  longPressDelay = 500,
  doubleTapDelay = 300,
  enableHapticFeedback = true,
  className = ''
}: TouchGestureHandlerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number; time: number } | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [lastTap, setLastTap] = useState<number>(0);
  const [initialDistance, setInitialDistance] = useState<number>(0);
  const [initialScale, setInitialScale] = useState<number>(1);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Add touch event listeners
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });
    container.addEventListener('touchcancel', handleTouchCancel, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [touchStart, touchEnd, longPressTimer, lastTap]);

  const handleTouchStart = (event: TouchEvent) => {
    event.preventDefault();
    
    const touch = event.touches[0];
    const touchData = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };

    setTouchStart(touchData);
    setTouchEnd(null);

    // Handle long press
    if (onLongPress) {
      const timer = setTimeout(() => {
        if (enableHapticFeedback) {
          mobileOptimizer.triggerHapticFeedback('medium');
        }
        onLongPress();
      }, longPressDelay);
      setLongPressTimer(timer);
    }

    // Handle pinch gesture
    if (event.touches.length === 2 && onPinch) {
      const distance = getDistance(event.touches[0], event.touches[1]);
      setInitialDistance(distance);
      setInitialScale(1);
    }

    // Handle pan gesture
    if (event.touches.length === 1 && onPan) {
      setPanStart({ x: touch.clientX, y: touch.clientY });
    }
  };

  const handleTouchMove = (event: TouchEvent) => {
    event.preventDefault();

    // Cancel long press if user moves
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    const touch = event.touches[0];
    setTouchEnd({
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    });

    // Handle pinch gesture
    if (event.touches.length === 2 && onPinch && initialDistance > 0) {
      const distance = getDistance(event.touches[0], event.touches[1]);
      const scale = distance / initialDistance;
      onPinch(scale);
    }

    // Handle pan gesture
    if (event.touches.length === 1 && onPan && panStart) {
      const deltaX = touch.clientX - panStart.x;
      const deltaY = touch.clientY - panStart.y;
      onPan(deltaX, deltaY);
    }
  };

  const handleTouchEnd = (event: TouchEvent) => {
    event.preventDefault();

    // Clear long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    if (!touchStart || !touchEnd) return;

    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = touchEnd.y - touchStart.y;
    const deltaTime = touchEnd.time - touchStart.time;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Check for swipe gestures
    if (distance > swipeThreshold && deltaTime < 500) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absX > absY) {
        // Horizontal swipe
        if (deltaX > 0) {
          // Swipe right
          if (onSwipeRight) {
            if (enableHapticFeedback) {
              mobileOptimizer.triggerHapticFeedback('light');
            }
            onSwipeRight();
          }
        } else {
          // Swipe left
          if (onSwipeLeft) {
            if (enableHapticFeedback) {
              mobileOptimizer.triggerHapticFeedback('light');
            }
            onSwipeLeft();
          }
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          // Swipe down
          if (onSwipeDown) {
            if (enableHapticFeedback) {
              mobileOptimizer.triggerHapticFeedback('light');
            }
            onSwipeDown();
          }
        } else {
          // Swipe up
          if (onSwipeUp) {
            if (enableHapticFeedback) {
              mobileOptimizer.triggerHapticFeedback('light');
            }
            onSwipeUp();
          }
        }
      }
    } else if (distance < 10 && deltaTime < 300) {
      // Check for double tap
      if (onDoubleTap) {
        const currentTime = Date.now();
        if (currentTime - lastTap < doubleTapDelay) {
          if (enableHapticFeedback) {
            mobileOptimizer.triggerHapticFeedback('light');
          }
          onDoubleTap();
        }
        setLastTap(currentTime);
      }
    }

    // Reset state
    setTouchStart(null);
    setTouchEnd(null);
    setPanStart(null);
    setInitialDistance(0);
    setInitialScale(1);
  };

  const handleTouchCancel = (event: TouchEvent) => {
    event.preventDefault();
    
    // Clear long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    // Reset state
    setTouchStart(null);
    setTouchEnd(null);
    setPanStart(null);
    setInitialDistance(0);
    setInitialScale(1);
  };

  const getDistance = (touch1: Touch, touch2: Touch): number => {
    const deltaX = touch1.clientX - touch2.clientX;
    const deltaY = touch1.clientY - touch2.clientY;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  };

  return (
    <div
      ref={containerRef}
      className={`touch-gesture-handler ${className}`}
      style={{
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none'
      }}
    >
      {children}
    </div>
  );
}
