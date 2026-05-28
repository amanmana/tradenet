import React from 'react';
import SectionCard from './SectionCard';

/**
 * Modal backdrop Dialog for dangerous operations like clearing data.
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = true
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-200">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-150">
        <SectionCard className="border border-slate-800 bg-slate-900 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
          <p className="text-sm text-slate-400 mb-6">{message}</p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-850 bg-slate-950 text-slate-300 hover:bg-slate-900 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${
                isDanger
                  ? 'bg-red-500 hover:bg-red-400 text-white'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
