'use client';

import { X } from 'lucide-react';

/**
 * ConsultationModal — a centered modal shell for the booking / call / chat
 * flow. Optionally hides the close button (e.g. while charging).
 *
 * `fullScreen` makes it fill the whole viewport on phones (used for the live
 * chat, which needs the room) while staying a centered card from `sm` up.
 */
export default function ConsultationModal({
  open, onClose, title, icon: Icon, children, closable = true, fullScreen = false,
}) {
  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center ${
        fullScreen ? 'p-0 sm:p-4' : 'p-4'
      }`}
    >
      <div
        className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
        onClick={closable ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative z-10 flex w-full flex-col overflow-hidden bg-surface shadow-card-hover ${
          fullScreen
            ? 'h-full max-w-none rounded-none sm:h-auto sm:max-w-md sm:rounded-2xl'
            : 'max-w-md rounded-2xl'
        }`}
      >
        {title && (
          <div className="flex shrink-0 items-center justify-between border-b border-ink/8 px-4 py-3">
            <div className="flex items-center gap-2">
              {Icon && (
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
              )}
              <h3 className="font-display text-base font-semibold text-ink">{title}</h3>
            </div>
            {closable && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid h-8 w-8 place-items-center rounded-lg text-ink/50 transition-colors hover:bg-ink/5 hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* On phones the body takes the remaining height so the chat fills it. */}
        <div className={fullScreen ? 'flex min-h-0 flex-1 flex-col' : ''}>{children}</div>
      </div>
    </div>
  );
}
