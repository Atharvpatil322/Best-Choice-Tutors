/**
 * Modal to preview a document (image or PDF) without downloading.
 * Uses native img for images and iframe for PDFs (browser built-in PDF viewer).
 */

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function DocumentPreviewModal({ open, onClose, fileUrl, fileType, fileName }) {
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const isPdf = fileType === 'PDF';
  const isImage = fileType === 'IMAGE';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Document preview"
    >
      <div
        className={cn(
          'relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-lg border bg-background shadow-xl',
          isPdf && 'min-h-[80vh]'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b px-4 py-2">
          <span className="truncate text-sm font-medium text-foreground" title={fileName}>
            {fileName || 'Preview'}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={onClose}
            aria-label="Close preview"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-4">
          {isImage && fileUrl && (
            <img
              src={fileUrl}
              alt={fileName || 'Document preview'}
              className="max-h-[70vh] w-auto max-w-full rounded object-contain"
            />
          )}
          {isPdf && fileUrl && (
            <iframe
              src={fileUrl}
              title={fileName || 'PDF preview'}
              className="h-[75vh] w-full min-h-[400px] rounded border bg-white"
            />
          )}
          {!isImage && !isPdf && (
            <p className="text-sm text-muted-foreground">Unsupported file type for preview.</p>
          )}
        </div>
      </div>
    </div>
  );
}
