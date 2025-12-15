'use client';

import { TextareaHTMLAttributes, forwardRef } from 'react';
import { InformationCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  success?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, success, className = '', value, ...props }, ref) => {
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
        <textarea
          ref={ref}
          className={`
            w-full px-3 py-2.5 border rounded-lg
            focus:outline-none focus:ring-2 transition-all resize-y
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

Textarea.displayName = 'Textarea';

export default Textarea;

