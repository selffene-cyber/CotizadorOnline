'use client';

import { useRef, useEffect, useState } from 'react';
import { 
  Bars3Icon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

interface RichTextEditorProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  className?: string;
  placeholder?: string;
  error?: string;
  helperText?: string;
}

export default function RichTextEditor({
  label,
  value,
  onChange,
  rows = 8,
  className = '',
  placeholder = '',
  error,
  helperText,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const listStyleRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isEmpty, setIsEmpty] = useState(!value || value.trim() === '' || value === '<br>');
  const [showListStyles, setShowListStyles] = useState(false);

  useEffect(() => {
    if (editorRef.current) {
      const currentContent = editorRef.current.innerHTML;
      if (currentContent !== value) {
        editorRef.current.innerHTML = value || '';
        setIsEmpty(!value || value.trim() === '' || value === '<br>');
      }
    }
  }, [value]);

  // Cerrar menú de estilos al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (listStyleRef.current && !listStyleRef.current.contains(event.target as Node)) {
        setShowListStyles(false);
      }
    };

    if (showListStyles) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showListStyles]);

  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      setIsEmpty(!content || content.trim() === '' || content === '<br>');
      onChange(content);
    }
  };

  const execCommand = (command: string, value?: string) => {
    if (!editorRef.current) return;
    
    // Asegurar que el editor tenga el foco
    editorRef.current.focus();
    
    // Ejecutar el comando
    const success = document.execCommand(command, false, value);
    
    if (success) {
      handleInput();
    }
  };

  const insertList = (ordered: boolean, listStyle?: string) => {
    if (!editorRef.current) return;
    
    editorRef.current.focus();
    
    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection) return;
      
      const listType = ordered ? 'insertOrderedList' : 'insertUnorderedList';
      
      // Usar el comando estándar primero
      const success = document.execCommand(listType, false);
      
      if (success) {
        // Si se especificó un estilo de lista, aplicarlo
        if (ordered && listStyle && editorRef.current) {
          const lists = editorRef.current.querySelectorAll('ol');
          if (lists.length > 0) {
            const lastList = lists[lists.length - 1] as HTMLOListElement;
            lastList.style.listStyleType = listStyle;
            lastList.setAttribute('type', listStyle);
          }
        }
        handleInput();
      }
    }, 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Manejar Enter para crear nuevos elementos de lista automáticamente
    if (e.key === 'Enter') {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      
      const range = selection.getRangeAt(0);
      let node: Node | null = range.startContainer;
      
      // Buscar si estamos dentro de una lista
      while (node && node !== editorRef.current) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          if (element.tagName === 'LI') {
            // Estamos en un elemento de lista, el comportamiento por defecto está bien
            return;
          }
        }
        node = node.parentNode;
      }
    }
  };

  const isCommandActive = (command: string): boolean => {
    return document.queryCommandState(command);
  };

  const borderColor = error 
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500';

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      
      {/* Barra de herramientas */}
      <div className="border border-b-0 rounded-t-lg bg-gray-50 p-2 flex items-center gap-1 flex-wrap">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execCommand('bold');
          }}
          className={`p-2 rounded hover:bg-gray-200 transition-colors font-bold ${
            isCommandActive('bold') ? 'bg-gray-300' : ''
          }`}
          title="Negrita (Ctrl+B)"
        >
          <span className="text-sm">B</span>
        </button>
        
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execCommand('italic');
          }}
          className={`p-2 rounded hover:bg-gray-200 transition-colors italic ${
            isCommandActive('italic') ? 'bg-gray-300' : ''
          }`}
          title="Cursiva (Ctrl+I)"
        >
          <span className="text-sm">I</span>
        </button>
        
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execCommand('underline');
          }}
          className={`p-2 rounded hover:bg-gray-200 transition-colors underline ${
            isCommandActive('underline') ? 'bg-gray-300' : ''
          }`}
          title="Subrayado (Ctrl+U)"
        >
          <span className="text-sm">U</span>
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            insertList(false);
          }}
          className={`p-2 rounded hover:bg-gray-200 transition-colors ${
            isCommandActive('insertUnorderedList') ? 'bg-gray-300' : ''
          }`}
          title="Viñetas"
        >
          <Bars3Icon className="w-4 h-4" />
        </button>
        
        <div className="relative inline-flex" ref={listStyleRef}>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              insertList(true, 'decimal');
            }}
            className={`p-2 rounded-l hover:bg-gray-200 transition-colors ${
              isCommandActive('insertOrderedList') ? 'bg-gray-300' : ''
            }`}
            title="Numeración (1, 2, 3...)"
          >
            <span className="text-xs font-mono">1.</span>
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setShowListStyles(!showListStyles);
            }}
            className={`p-1 rounded-r hover:bg-gray-200 transition-colors border-l border-gray-300 ${
              showListStyles ? 'bg-gray-300' : ''
            }`}
            title="Más opciones de numeración"
          >
            <ChevronDownIcon className={`w-3 h-3 transition-transform ${showListStyles ? 'rotate-180' : ''}`} />
          </button>
          
          {showListStyles && (
            <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[140px]">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertList(true, 'decimal');
                  setShowListStyles(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
              >
                <span className="font-mono w-6">1.</span>
                <span>1, 2, 3...</span>
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertList(true, 'lower-alpha');
                  setShowListStyles(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
              >
                <span className="font-mono w-6">a.</span>
                <span>a, b, c...</span>
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertList(true, 'upper-alpha');
                  setShowListStyles(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
              >
                <span className="font-mono w-6">A.</span>
                <span>A, B, C...</span>
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertList(true, 'lower-roman');
                  setShowListStyles(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
              >
                <span className="font-mono w-6">i.</span>
                <span>i, ii, iii...</span>
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertList(true, 'upper-roman');
                  setShowListStyles(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
              >
                <span className="font-mono w-6">I.</span>
                <span>I, II, III...</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Área de edición */}
      <div className="relative">
        <style jsx global>{`
          [contenteditable] ul,
          [contenteditable] ol {
            margin-left: 1.5rem !important;
            margin-top: 0.5rem !important;
            margin-bottom: 0.5rem !important;
            padding-left: 0.5rem !important;
          }
          [contenteditable] ul {
            list-style-type: disc !important;
            list-style-position: outside !important;
          }
          [contenteditable] ol {
            list-style-type: decimal !important;
            list-style-position: outside !important;
          }
          [contenteditable] ol[type="lower-alpha"],
          [contenteditable] ol[style*="list-style-type: lower-alpha"] {
            list-style-type: lower-alpha !important;
          }
          [contenteditable] ol[type="upper-alpha"],
          [contenteditable] ol[style*="list-style-type: upper-alpha"] {
            list-style-type: upper-alpha !important;
          }
          [contenteditable] ol[type="lower-roman"],
          [contenteditable] ol[style*="list-style-type: lower-roman"] {
            list-style-type: lower-roman !important;
          }
          [contenteditable] ol[type="upper-roman"],
          [contenteditable] ol[style*="list-style-type: upper-roman"] {
            list-style-type: upper-roman !important;
          }
          [contenteditable] li {
            margin-bottom: 0.25rem !important;
            padding-left: 0.25rem !important;
            display: list-item !important;
          }
          [contenteditable] p {
            margin-bottom: 0.5rem;
          }
        `}</style>
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`
            w-full px-3 py-2.5 border rounded-b-lg
            focus:outline-none focus:ring-2 transition-all
            ${isFocused ? 'ring-2' : ''}
            ${borderColor}
            ${error ? 'bg-red-50' : 'bg-white'}
            text-gray-900
            overflow-y-auto
          `}
          style={{
            minHeight: `${rows * 1.5}rem`,
          }}
          suppressContentEditableWarning
          aria-invalid={error ? 'true' : 'false'}
        />
        {isEmpty && placeholder && (
          <div 
            className="absolute top-2.5 left-3 text-gray-400 pointer-events-none select-none"
          >
            {placeholder}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p className="mt-1.5 text-sm text-gray-500 flex items-center gap-1">
          {helperText}
        </p>
      )}
    </div>
  );
}

