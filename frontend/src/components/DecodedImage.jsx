import { useCallback, useLayoutEffect, useRef, useState } from 'react';

/**
 * Hides the image until it is fully loaded and decoded so progressive JPEGs
 * do not paint in visible “chunks”. Same src/bytes as a plain <img>.
 *
 * Handles cached images: `load` may fire before `onLoad` is attached, so we
 * also reveal when `complete && naturalWidth > 0` after commit (sign-in/up logo, etc.).
 */
export function DecodedImage({ src, alt, className, style, onError, ...rest }) {
  const [visible, setVisible] = useState(false);
  const imgRef = useRef(null);

  const revealFromElement = useCallback((el) => {
    const show = () => setVisible(true);
    if (typeof el.decode === 'function') {
      el.decode().then(show).catch(show);
    } else {
      show();
    }
  }, []);

  useLayoutEffect(() => {
    setVisible(false);
    const el = imgRef.current;
    if (el?.complete && el.naturalWidth > 0) {
      revealFromElement(el);
    }
  }, [src, revealFromElement]);

  const handleLoad = useCallback(
    (e) => {
      revealFromElement(e.currentTarget);
    },
    [revealFromElement],
  );

  const handleError = useCallback(
    (e) => {
      setVisible(true);
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
