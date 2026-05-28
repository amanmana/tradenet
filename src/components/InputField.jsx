import React from 'react';
import { Info } from 'lucide-react';

/**
 * Reusable form input component with prefix/suffix support and error validation styles.
 */
export default function InputField({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  helperText,
  prefix,
  suffix,
  disabled = false,
  className = '',
  tooltip,
  ...props
}) {
  return (
    <div className={`flex flex-col space-y-1.5 w-full ${className}`}>
      {label && (
        <div className="flex items-center space-x-1.5 mb-0.5">
          <label htmlFor={id} className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
            {label}
          </label>
          {tooltip && (
            <div className="group relative flex items-center">
              <span className="cursor-help text-slate-500 hover:text-slate-350 transition-colors">
                <Info className="w-3.5 h-3.5" />
              </span>
              <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-52 p-2 rounded-xl bg-slate-900 border border-slate-800 text-[10px] text-slate-300 leading-normal shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 normal-case font-normal select-none pointer-events-none">
                {tooltip}
              </div>
            </div>
          )}
        </div>
      )}
      <div className="relative flex items-center">
        {prefix && (
          <div className="absolute left-3.5 text-slate-500 font-medium select-none pointer-events-none text-sm">
            {prefix}
          </div>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full bg-slate-950/60 border ${
            error ? 'border-red-500/80 focus:border-red-500' : 'border-slate-800/80 hover:border-slate-700/60 focus:border-emerald-500/80'
          } rounded-xl py-2.5 ${prefix ? 'pl-10' : 'pl-4'} ${suffix ? 'pr-10' : 'pr-4'} text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 ${
            error ? 'focus:ring-red-500' : 'focus:ring-emerald-500'
          } transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
          {...props}
        />
        {suffix && (
          <div className="absolute right-3.5 text-slate-500 font-medium select-none pointer-events-none text-sm">
            {suffix}
          </div>
        )}
      </div>
      {error && <span className="text-xs text-red-400 mt-0.5">{error}</span>}
      {!error && helperText && <span className="text-xs text-slate-500 mt-0.5">{helperText}</span>}
    </div>
  );
}
