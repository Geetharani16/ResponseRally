import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PanelRight, PanelRightClose, Copy, Check } from 'lucide-react';

interface JsonResponsePanelProps {
  responseData: any;
  isOpen: boolean;
  onToggle: () => void;
}

export const JsonResponsePanel: React.FC<JsonResponsePanelProps> = ({
  responseData,
  isOpen,
  onToggle
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(responseData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50 bg-background/80 backdrop-blur-sm border-l-0 rounded-l-none"
      >
        <PanelRight className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <div className={cn(
      "fixed right-0 top-0 h-full w-96 bg-background border-l border-border z-50 transform transition-transform duration-300 ease-in-out",
      "flex flex-col"
    )}>
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Raw JSON Response</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="h-8"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onToggle}
            className="h-8"
          >
            <PanelRightClose className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <pre className="text-xs font-mono text-muted-foreground bg-muted p-3 rounded overflow-x-auto">
          {responseData ? JSON.stringify(responseData, null, 2) : 'No response data available'}
        </pre>
      </div>
    </div>
  );
};