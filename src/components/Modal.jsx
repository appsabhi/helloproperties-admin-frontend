import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-3xl',
  '2xl': 'max-w-5xl',
  full: 'max-w-6xl'
};

export default function Modal({
  isOpen = true,
  onClose,
  title,
  subtitle,
  icon: Icon,
  badge,
  size = 'md',
  children,
  footer,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = ''
}) {
  // Handle Escape key press
  const handleKeyDown = useCallback(
    (e) => {
      if (closeOnEscape && e.key === 'Escape' && onClose) {
        onClose();
      }
    },
    [closeOnEscape, onClose]
  );

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const maxWidthClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 md:p-6 pointer-events-auto">
      {/* Dark Translucent Backdrop with subtle blur */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={() => closeOnOverlayClick && onClose && onClose()}
        aria-hidden="true"
      />

      {/* Modal Surface Box */}
      <div
        className={`relative bg-white rounded-2xl border border-slate-200/80 shadow-2xl flex flex-col w-full max-h-[90vh] my-auto overflow-hidden animate-scale-up z-10 ${maxWidthClass} ${className}`}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        {(title || onClose) && (
          <div className="sticky top-0 z-20 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3 min-w-0 pr-4">
              {Icon && (
                <div className="w-9 h-9 rounded-xl bg-[#B0004F]/10 text-[#B0004F] flex items-center justify-center shrink-0">
                  {typeof Icon === 'function' || typeof Icon === 'object' ? <Icon className="w-5 h-5" /> : Icon}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  {title && (
                    <h3 className="font-bold text-base sm:text-lg text-slate-900 truncate">
                      {title}
                    </h3>
                  )}
                  {badge && <div className="shrink-0">{badge}</div>}
                </div>
                {subtitle && (
                  <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>
                )}
              </div>
            </div>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Scrollable Body Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-4">
          {children}
        </div>

        {/* Sticky Footer Action Bar */}
        {footer && (
          <div className="sticky bottom-0 z-20 bg-slate-50/95 backdrop-blur-xs border-t border-slate-100 px-6 py-3.5 flex flex-wrap items-center justify-end gap-2.5 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}

export function ModalHeader({ children, className = '' }) {
  return <div className={`space-y-1 ${className}`}>{children}</div>;
}

export function ModalBody({ children, className = '' }) {
  return <div className={`space-y-4 ${className}`}>{children}</div>;
}

export function ModalFooter({ children, className = '' }) {
  return (
    <div className={`flex flex-wrap items-center justify-end gap-2.5 w-full ${className}`}>
      {children}
    </div>
  );
}

