'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import { InformationCircleIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
  helperText?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, success, helperText, icon, className = '', value, ...props }, ref) => {
    const hasFeedback = error || success;
    const borderColor = error 
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
      : success 
      ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500';

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full px-3 py-2.5 border rounded-lg
              focus:outline-none focus:ring-2 transition-all
              ${icon ? 'pl-10' : ''}
              ${hasFeedback ? '' : 'hover:border-gray-400'}
              ${borderColor}
              ${error ? 'bg-red-50' : success ? 'bg-green-50' : 'bg-white'}
              ${className}
            `}
            {...props}
            value={value ?? ''}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined}
          />
          {hasFeedback && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {error && <ExclamationCircleIcon className="w-5 h-5 text-red-500" />}
              {success && <CheckCircleIcon className="w-5 h-5 text-green-500" />}
            </div>
          )}
        </div>
        {error && (
          <p id={`${props.id}-error`} className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
            <ExclamationCircleIcon className="w-4 h-4" />
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={`${props.id}-helper`} className="mt-1.5 text-sm text-gray-500 flex items-center gap-1">
            <InformationCircleIcon className="w-4 h-4" />
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
