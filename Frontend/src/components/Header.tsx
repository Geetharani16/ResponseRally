import React from 'react';
import { cn } from '@/lib/utils';
import { Zap, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { ServerStatusIndicator } from '@/components/ServerStatusIndicator';

interface HeaderProps {
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onReset }) => {
  const { theme, setTheme } = useTheme();

  return (
    <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-[1800px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                <span className="gradient-text">Response</span>
                <span className="text-foreground">Rally</span>
              </h1>
              <p className="text-xs text-muted-foreground">
                AI Benchmarking & Research Interface
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={cn(
                'text-sm text-muted-foreground hover:text-foreground',
                'p-2 rounded-lg hover:bg-muted/50',
                'transition-colors duration-200',
                'flex items-center justify-center'
              )}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={onReset}
              className={cn(
                'text-sm text-muted-foreground hover:text-foreground',
                'px-3 py-1.5 rounded-lg hover:bg-muted/50',
                'transition-colors duration-200'
              )}
            >
              New Session
            </button>
            
            <ServerStatusIndicator />
            
            {/**
             * =====================================================
             * SESSION MANAGEMENT PLACEHOLDER
             * =====================================================
             * Future features:
             * - Export session data (JSON/CSV)
             * - Share session link
             * - Load previous sessions
             * - User authentication
             * =====================================================
             */}
          </div>
        </div>
      </div>
    </header>
  );
};
