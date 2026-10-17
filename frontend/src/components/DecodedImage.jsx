import { useCallback, useLayoutEffect, useRef, useState } from 'react';

/**
 * <img> that paints as soon as bytes arrive and shows a neutral placeholder
 * while it loads, so a slow image reads as "loading" instead of an empty gap.
 * Decoding is left to the browser (decoding="async") rather than blocking
 * visibility on it. Defaults to native lazy-loading; override with
 * loading="eager" for LCP-critical images.
 */
export function DecodedImage({
  src,
  alt,
  className,
  style,
  onError,
  onLoad,
  loading = 'lazy',
  ...rest
}) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef(null);

  // Cached images can finish loading before React attaches onLoad.
  useLayoutEffect(() => {
    setLoaded(Boolean(imgRef.current?.complete && imgRef.current.naturalWidth > 0));
  }, [src]);

  const handleLoad = useCallback(
    (e) => {
      setLoaded(true);
      onLoad?.(e);
    },
    [onLoad],
  );

  const handleError = useCallback(
    (e) => {
      setLoaded(true);
      onError?.(e);
    },
    [onError],
  );

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      style={{
        ...(loaded ? null : { backgroundColor: '#f1f5f9' }),
        ...style,
      }}
      onLoad={handleLoad}
      onError={handleError}
      {...rest}
    />
  );
}
