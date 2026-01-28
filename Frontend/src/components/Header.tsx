import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, Sun, Moon, Workflow, Upload, Plus } from 'lucide-react';
import { useTheme } from 'next-themes';
import ConversationFlowDialog from '@/components/ConversationFlowDialog';
import ExportDialog from '@/components/ExportDialog';
import { ConversationHistoryPanel } from '@/components/ConversationHistoryPanel';

interface HeaderProps {
  onReset: () => void;
  session: import('@/types').SessionState;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onReset, session, onLogout }) => {
  const { theme, setTheme } = useTheme();
  const [showFlowDialog, setShowFlowDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);

  // Keyboard shortcut: Ctrl/Cmd + H to open history
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        setShowHistoryPanel(true);
      }
      // Prevent Ctrl+R from triggering new session - let browser handle refresh
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        // Don't prevent default - allow browser refresh
        return;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNewConversation = () => {
    // Dispatch event to create new conversation in main app
    window.dispatchEvent(new CustomEvent('rr-new-session'));
  };

  return (
    <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-[1800px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowHistoryPanel(true)}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary hover:scale-105 transition-transform duration-200"
                aria-label="Open conversation history"
              >
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </button>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                <span className="gradient-text">ResponseRally</span>
                <span className="text-foreground"> as Start!</span>
              </h1>
              <p className="text-xs text-muted-foreground">
                AI Benchmarking & Research Interface
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* New Conversation Icon */}
            <button
              onClick={handleNewConversation}
              className={cn(
                'text-sm text-muted-foreground hover:text-foreground',
                'p-2 rounded-lg hover:bg-muted/50',
                'transition-colors duration-200',
                'flex items-center justify-center'
              )}
              aria-label="New conversation"
            >
              <Plus className="w-4 h-4" />
            </button>

            <button
              className={cn(
                'text-sm text-muted-foreground hover:text-foreground',
                'p-2 rounded-lg hover:bg-muted/50',
                'transition-colors duration-200',
                'flex items-center justify-center'
              )}
              aria-label="Export"
              onClick={() => setShowExportDialog(true)}
            >
              <Upload className="w-4 h-4" />
            </button>
            
            <ExportDialog 
              isOpen={showExportDialog}
              onClose={() => setShowExportDialog(false)} 
              session={session}
            />
            <button
              className={cn(
                'text-sm text-muted-foreground hover:text-foreground',
                'p-2 rounded-lg hover:bg-muted/50',
                'transition-colors duration-200',
                'flex items-center justify-center'
              )}
              aria-label="Flow chat"
              onClick={() => setShowFlowDialog(true)}
            >
              <Workflow className="w-4 h-4" />
            </button>
            
            <ConversationFlowDialog 
              isOpen={showFlowDialog}
              onClose={() => setShowFlowDialog(false)} 
              session={session}
            />
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
      
      {/* Conversation History Panel */}
      <ConversationHistoryPanel 
        isOpen={showHistoryPanel}
        onClose={() => setShowHistoryPanel(false)}
        onLoadConversation={(conversation) => {
          // Dispatch event to load conversation in main app
          window.dispatchEvent(new CustomEvent('rr-load-conversation', {
            detail: conversation
          }));
        }}
        onLogout={onLogout}
        currentSession={session}
      />
    </header>
  );
};