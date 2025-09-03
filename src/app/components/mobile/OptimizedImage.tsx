'use client';

import React, { useState, useRef, useEffect } from 'react';
import { mobileOptimizer } from '@/lib/mobile/mobileOptimizer';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  lazy?: boolean;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
  fallback?: string;
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  quality,
  format,
  lazy = true,
  placeholder,
  className = '',
  style,
  onLoad,
  onError,
  fallback
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(placeholder || '');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isInView, setIsInView] = useState<boolean>(!lazy);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (lazy && imgRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsInView(true);
              observerRef.current?.unobserve(entry.target);
            }
          });
        },
        {
          rootMargin: '50px',
          threshold: 0.1
        }
      );

      observerRef.current.observe(imgRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [lazy]);

  useEffect(() => {
    if (isInView && src) {
      loadOptimizedImage();
    }
  }, [isInView, src]);

  const loadOptimizedImage = async () => {
    try {
      // Get optimized image URL
      const optimizedSrc = mobileOptimizer.optimizeImage(src, {
        width,
        height,
        quality,
        format
      });

      // Create a new image to test if it loads
      const testImg = new Image();
      
      testImg.onload = () => {
        setImageSrc(optimizedSrc);
        setIsLoaded(true);
        setHasError(false);
        onLoad?.();
      };

      testImg.onerror = () => {
        // Try fallback if available
        if (fallback) {
          const fallbackSrc = mobileOptimizer.optimizeImage(fallback, {
            width,
            height,
            quality,
            format
          });
          setImageSrc(fallbackSrc);
          setIsLoaded(true);
          setHasError(false);
          onLoad?.();
        } else {
          setHasError(true);
          onError?.();
        }
      };

      testImg.src = optimizedSrc;
    } catch (error) {
      console.error('Error loading optimized image:', error);
      setHasError(true);
      onError?.();
    }
  };

  const handleImageLoad = () => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.();
  };

  const handleImageError = () => {
    setHasError(true);
    onError?.();
  };

  if (hasError) {
    return (
      <div
        className={`optimized-image-error ${className}`}
        style={{
          width: width || '100%',
          height: height || '200px',
          backgroundColor: '#f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6b7280',
          fontSize: '14px',
          ...style
        }}
      >
        <span>Failed to load image</span>
      </div>
    );
  }

  return (
    <div
      ref={imgRef}
      className={`optimized-image-container ${className}`}
      style={{
        position: 'relative',
        width: width || '100%',
        height: height || 'auto',
        overflow: 'hidden',
        ...style
      }}
    >
      {/* Placeholder/Loading state */}
      {!isLoaded && (
        <div
          className="optimized-image-placeholder"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1
          }}
        >
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        </div>
      )}

      {/* Actual image */}
      {isInView && (
        <img
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          className={`optimized-image ${isLoaded ? 'loaded' : 'loading'}`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'opacity 0.3s ease-in-out',
            opacity: isLoaded ? 1 : 0,
            zIndex: 2
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading={lazy ? 'lazy' : 'eager'}
          decoding="async"
        />
      )}
    </div>
  );
}
