import { formatVersion, isVersionOutdated } from '../hooks/useVersionInfo';

interface VersionIndicatorProps {
  label: string;
  version: string;
  loading?: boolean;
  error?: boolean;
  color?: 'blue' | 'green' | 'purple' | 'yellow';
  expectedVersion?: string;
  compact?: boolean;
}

export default function VersionIndicator({ 
  label, 
  version, 
  loading = false, 
  error = false,
  color = 'blue',
  expectedVersion,
  compact = false
}: VersionIndicatorProps) {
  const isOutdated = expectedVersion ? isVersionOutdated(version, expectedVersion) : false;
  
  const getColorClass = () => {
    if (loading) return 'text-gray-400';
    if (error) return 'text-red-400';
    if (isOutdated) return 'text-yellow-400';
    
    switch (color) {
      case 'blue': return 'text-blue-400';
      case 'green': return 'text-green-400';
      case 'purple': return 'text-purple-400';
      case 'yellow': return 'text-yellow-400';
      default: return 'text-blue-400';
    }
  };

  const getStatusIcon = () => {
    if (loading) {
      return (
        <svg className="w-3 h-3 animate-spin text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      );
    }
    
    if (error) {
      return (
        <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    }
    
    if (isOutdated) {
      return (
        <svg className="w-3 h-3 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      );
    }
    
    return (
      <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    );
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-1">
        <span className="text-gray-400 text-xs">{label}</span>
        <span className={`text-xs font-medium ${getColorClass()}`}>
          {formatVersion(version)}
        </span>
        {getStatusIcon()}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-gray-400">{label}:</span>
      <div className="flex items-center space-x-1">
        <span className={`font-medium ${getColorClass()}`}>
          {formatVersion(version)}
        </span>
        {getStatusIcon()}
      </div>
      {isOutdated && expectedVersion && (
        <span className="text-xs text-yellow-300">
          (aktuālā: {formatVersion(expectedVersion)})
        </span>
      )}
    </div>
  );
}

// Simplified version for inline use
export function InlineVersionIndicator({ version, loading, error }: { version: string, loading?: boolean, error?: boolean }) {
  if (loading) {
    return <span className="text-gray-400 animate-pulse">{formatVersion(version)}</span>;
  }
  
  if (error) {
    return (
      <span className="text-red-400 flex items-center">
        {formatVersion(version)}
        <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
        </svg>
      </span>
    );
  }
  
  return (
    <span className="text-green-400 flex items-center">
      {formatVersion(version)}
      <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    </span>
  );
}