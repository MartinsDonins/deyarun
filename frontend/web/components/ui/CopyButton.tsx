import React, { useState } from 'react';
import { ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline';
import { logger } from '../../lib/productionLogger'

interface CopyButtonProps {
  text: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ 
  text, 
  className = '', 
  size = 'md', 
  label = 'Kopēt'
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      logger.error('ERROR', 'Failed to copy text:', { error: error });
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const buttonSizes = {
    sm: 'p-1 text-xs',
    md: 'p-2 text-sm',
    lg: 'p-3 text-base'
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center space-x-2 ${buttonSizes[size]} 
        ${copied 
          ? 'bg-green-500 hover:bg-green-600 text-white' 
          : 'bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200'
        }
        rounded-lg transition-all duration-200 font-medium ${className}`}
      title={copied ? 'Nokopēts!' : `Kopēt ${label}`}
    >
      {copied ? (
        <CheckIcon className={sizeClasses[size]} />
      ) : (
        <ClipboardIcon className={sizeClasses[size]} />
      )}
      <span>{copied ? 'Nokopēts!' : label}</span>
    </button>
  );
};

export default CopyButton;