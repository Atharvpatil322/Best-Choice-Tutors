import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * Hides the image until it is fully loaded and decoded so progressive JPEGs
 * do not paint in visible “chunks”. Same src/bytes as a plain <img>.
 * Defaults to native lazy-loading; override with loading="eager" for LCP-critical images.
 */
export function DecodedImage({
  src,
  alt,
  className,
  style,
  onError,
  loading = 'lazy',
  ...rest
}) {
  const [visible, setVisible] = useState(false);
  const revealTimeoutRef = useRef(null);

  const clearRevealTimeout = useCallback(() => {
    if (revealTimeoutRef.current) {
      clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }
  }, []);

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
      loading={loading}
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
