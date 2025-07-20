'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  RefreshCw,
  Signal,
  SignalHigh,
  SignalMedium,
  SignalLow
} from 'lucide-react';
import { useRealtimeSocket } from '@/contexts/socket-context';

interface ConnectionStatusProps {
  showDetails?: boolean;
  className?: string;
}

export function ConnectionStatus({ showDetails = false, className = '' }: ConnectionStatusProps) {
  const { connected, connecting, error, reconnectAttempts, latency, connect } = useRealtimeSocket();

  const getStatusIcon = () => {
    if (connecting) return <RefreshCw className="h-3 w-3 animate-spin" />;
    if (error) return <WifiOff className="h-3 w-3" />;
    if (connected) return <Wifi className="h-3 w-3" />;
    return <WifiOff className="h-3 w-3" />;
  };

  const getStatusColor = () => {
    if (connecting) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (error) return 'bg-red-100 text-red-800 border-red-200';
    if (connected) return 'bg-green-100 text-green-800 border-green-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusText = () => {
    if (connecting) return 'Connecting...';
    if (error) return 'Disconnected';
    if (connected) return 'Connected';
    return 'Offline';
  };

  const getSignalIcon = () => {
    if (!connected || latency === 0) return null;
    
    if (latency < 100) return <SignalHigh className="h-3 w-3 text-green-600" />;
    if (latency < 300) return <SignalMedium className="h-3 w-3 text-yellow-600" />;
    if (latency < 1000) return <SignalLow className="h-3 w-3 text-orange-600" />;
    return <Signal className="h-3 w-3 text-red-600" />;
  };

  const handleReconnect = () => {
    if (!connecting && !connected) {
      connect();
    }
  };

  if (!showDetails) {
    return (
      <div className={`flex items-center space-x-1 ${className}`} data-testid="connection-status">
        <div className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : error ? 'bg-red-500' : 'bg-yellow-500'}`} />
        {connected && latency > 0 && (
          <span className="text-xs text-gray-500">{latency}ms</span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Badge variant="outline" className={`text-xs ${getStatusColor()}`}>
        <div className="flex items-center space-x-1">
          {getStatusIcon()}
          <span>{getStatusText()}</span>
        </div>
      </Badge>

      {connected && latency > 0 && (
        <div className="flex items-center space-x-1">
          {getSignalIcon()}
          <span className="text-xs text-gray-500">{latency}ms</span>
        </div>
      )}

      {reconnectAttempts > 0 && (
        <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-200">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Retry {reconnectAttempts}
        </Badge>
      )}

      {error && !connecting && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleReconnect}
          className="h-6 px-2 text-xs"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Reconnect
        </Button>
      )}

      {error && (
        <div className="text-xs text-red-600 max-w-xs truncate" title={error}>
          {error}
        </div>
      )}
    </div>
  );
}