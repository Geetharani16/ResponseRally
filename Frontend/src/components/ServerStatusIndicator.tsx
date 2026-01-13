import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

type ServerStatus = 'connected' | 'disconnected' | 'connecting';

interface ServerStatusIndicatorProps {
  url?: string;
  pollInterval?: number;
}

export const ServerStatusIndicator: React.FC<ServerStatusIndicatorProps> = ({
  url = 'http://localhost:5001/health',
  pollInterval = 5000
}) => {
  const [status, setStatus] = useState<ServerStatus>('connecting');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // Function to check server health
  const checkServerHealth = async () => {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'omit', // Don't send cookies
      });
      
      if (response.ok) {
        setStatus('connected');
      } else {
        setStatus('disconnected');
      }
    } catch (error) {
      setStatus('disconnected');
    }
    setLastChecked(new Date());
  };

  // Initial check
  useEffect(() => {
    checkServerHealth();
  }, []);

  // Set up polling
  useEffect(() => {
    const interval = setInterval(checkServerHealth, pollInterval);
    return () => clearInterval(interval);
  }, [pollInterval]);

  // Get status configuration
  const statusConfig = {
    connected: {
      icon: <Wifi className="w-4 h-4" />,
      label: 'Connected',
      colorClass: 'text-green-500',
      circleColor: 'bg-green-500',
    },
    disconnected: {
      icon: <WifiOff className="w-4 h-4" />,
      label: 'Disconnected',
      colorClass: 'text-red-500',
      circleColor: 'bg-red-500',
    },
    connecting: {
      icon: <Loader2 className="w-4 h-4 animate-spin" />,
      label: 'Connecting',
      colorClass: 'text-yellow-500',
      circleColor: 'bg-yellow-500',
    },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors duration-200">
      <div className="flex items-center gap-1.5">
        <div className={`w-2.5 h-2.5 rounded-full ${config.circleColor}`}></div>
        <span className="text-sm font-medium text-foreground">Server</span>
      </div>
      <div className={cn('flex items-center gap-1.5', config.colorClass)}>
        {config.icon}

      </div>
    </div>
  );
};