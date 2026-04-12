import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * Hides the image until it is fully loaded and decoded so progressive JPEGs
 * do not paint in visible “chunks”. Same src/bytes as a plain <img>.
 */
export function DecodedImage({ src, alt, className, style, onError, ...rest }) {
  const [visible, setVisible] = useState(false);
  const imgRef = useRef(null);
  const revealTimeoutRef = useRef(null);

  const clearRevealTimeout = useCallback(() => {
    if (revealTimeoutRef.current) {
      clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }
  }, []);

  const revealFromElement = useCallback((el) => {
    const show = () => setVisible(true);
    clearRevealTimeout();
    if (typeof el.decode === 'function') {
      el.decode().then(show).catch(show);
    } else {
      show();
    }
  }, [clearRevealTimeout]);

  useLayoutEffect(() => {
    setVisible(false);
  }, [src]);

  useEffect(() => {
    if (!src) return undefined;
    revealTimeoutRef.current = setTimeout(() => {
      setVisible(true);
      revealTimeoutRef.current = null;
    }, 1500);
    return () => clearRevealTimeout();
  }, [src, clearRevealTimeout]);

  const handleLoad = useCallback(
    (e) => {
      const el = e.currentTarget;
      const reveal = () => setVisible(true);
      if (typeof el.decode === 'function') {
        el.decode().then(reveal).catch(reveal);
      } else {
        reveal();
      }
    },
    [],
  );

  const handleError = useCallback(
    (e) => {
      setVisible(true);
      clearRevealTimeout();
      onError?.(e);
    },
    [onError, clearRevealTimeout],
  );

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={{
        ...style,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.2s ease-out',
      }}
      onLoad={handleLoad}
      onError={handleError}
      {...rest}
    />
  );
}
