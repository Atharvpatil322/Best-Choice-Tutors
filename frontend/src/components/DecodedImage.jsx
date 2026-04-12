import { useCallback, useEffect, useState } from 'react';

/**
 * Hides the image until it is fully loaded and decoded so progressive JPEGs
 * do not paint in visible “chunks”. Same src/bytes as a plain <img>.
 */
export function DecodedImage({ src, alt, className, style, onError, ...rest }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
  }, [src]);

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
      onError?.(e);
    },
    [onError],
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
