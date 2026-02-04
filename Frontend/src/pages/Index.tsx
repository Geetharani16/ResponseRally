import React, { useState, useEffect } from 'react';
import { useSession } from '@/hooks/useSession';
import { Header } from '@/components/Header';
import { PromptInput } from '@/components/PromptInput';
import { ResponseGrid } from '@/components/ResponseGrid';
import { ConversationHistory } from '@/components/ConversationHistory';
import { cn } from '@/lib/utils';
import { AuthModal } from '@/components/AuthModal';

/**
 * =====================================================
 * RESPONSE RALLY - AI BENCHMARKING INTERFACE
 * =====================================================
 * 
 * A production-ready interface for comparing AI responses
 * from multiple providers (GPT, LLaMA, Mistral, Gemini, 
 * Copilot, DeepSeek) side-by-side.
 * 
 * ARCHITECTURE OVERVIEW:
 * - Session state managed via useSession hook
 * - Mock API simulates backend responses (see lib/mockApi.ts)
 * - Conversation history tracks selected "best" responses
 * - Each turn builds on prior context (frontend-only for now)
 * 
 * BACKEND INTEGRATION POINTS:
 * - See hooks/useSession.ts for API call placeholders
 * - See lib/mockApi.ts for response handling patterns

 * 
 * =====================================================
 */

const Index: React.FC = () => {
  const {
    session,
    submitPrompt,
    selectBestResponse,
    toggleProvider,
    resetSession,
    retryProvider,
  } = useSession();

  const hasCurrentResponses = session.currentResponses.length > 0;
  const hasHistory = session.conversationHistory.length > 0;

  // Add authentication state with localStorage persistence
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  const [showAuthModal, setShowAuthModal] = useState(() => {
    return localStorage.getItem('isAuthenticated') !== 'true';
  });

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setShowAuthModal(false);
    localStorage.setItem('isAuthenticated', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setShowAuthModal(true);
    localStorage.removeItem('isAuthenticated');
  };

  // Handle new conversation event
  useEffect(() => {
    const handleNewConversation = () => {
      resetSession();
    };

    window.addEventListener('rr-new-session', handleNewConversation);
    return () => {
      window.removeEventListener('rr-new-session', handleNewConversation);
    };
  }, [resetSession]);

  // If not authenticated, show auth modal
  if (!isAuthenticated && showAuthModal) {
    return (
      <div className="min-h-screen bg-background">
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => {}}
          onAuthSuccess={handleAuthSuccess}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Auth Modal - can be shown again on logout */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <Header onReset={resetSession} session={session} onLogout={handleLogout} />

      <main className="max-w-[1800px] mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Conversation History */}
          {(hasHistory || session.currentPrompt) && (
            <section className="animate-fade-in">
              <ConversationHistory 
                turns={session.conversationHistory} 
                currentPrompt={session.currentPrompt}
                isProcessing={session.isProcessing}
              />
            </section>
          )}

          {/* Response Comparison Grid */}
          {hasCurrentResponses && (
            <section className="animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">
                  Response Comparison
                </h2>
                {session.isProcessing && (
                  <span className="text-sm text-primary font-mono">
                    Processing responses...
                  </span>
                )}
              </div>
              
              <ResponseGrid
                responses={session.currentResponses}
                selectedResponseId={session.selectedResponseId}
                onSelectBest={selectBestResponse}
                onRetry={retryProvider}
              />

              {/* Selection Hint */}
              {!session.isProcessing && session.currentResponses.some(r => r.status === 'success') && !session.selectedResponseId && (
                <div className="mt-4 p-4 glass-card rounded-lg border border-primary/30">
                  <p className="text-sm text-muted-foreground text-center">
                    <span className="text-primary font-medium">Tip:</span> Select the best response to continue the conversation. 
                    The selected response will be used as context for your next prompt.
                  </p>
                </div>
              )}
            </section>
          )}

          {/* Prompt Input Section */}
          <section className={cn(
            'transition-all duration-500',
            hasCurrentResponses && !session.selectedResponseId ? 'opacity-50 pointer-events-none' : '',
            session.currentPrompt && session.isProcessing ? 'opacity-50 pointer-events-none' : ''
          )}>
            {(hasHistory || session.currentPrompt) && !hasCurrentResponses && (
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-foreground">
                  {session.currentPrompt ? 'Processing Prompt' : 'Continue Conversation'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {session.currentPrompt
                    ? 'Your current prompt is being processed by multiple AI providers.'
                    : 'Your next prompt will use the conversation context above.'}
                </p>
              </div>
            )}
            
            {!hasHistory && !hasCurrentResponses && !session.currentPrompt && (
              <div className="text-center mb-8 animate-fade-in">
                <h2 className="text-3xl font-bold mb-3">
                  <span className="gradient-text">Compare AI Responses</span>
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Submit a prompt and see how different AI models respond. 
                  Compare quality, latency, and style across GPT-4, LLaMA, Mistral, 
                  Gemini, Copilot, and DeepSeek.
                </p>
              </div>
            )}

            <PromptInput
              onSubmit={submitPrompt}
              isProcessing={session.isProcessing}
              enabledProviders={session.enabledProviders}
              onToggleProvider={toggleProvider}
              placeholder={
                session.currentPrompt && session.isProcessing
                  ? "Processing current prompt..."
                  : hasHistory
                    ? "Continue the conversation..."
                    : "Enter your prompt here... Compare responses from multiple AI providers."
              }
            />
          </section>

          {/* Empty State */}
          {!hasHistory && !hasCurrentResponses && (
            <section className="py-12 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FeatureCard
                  title="Multi-Provider"
                  description="Compare responses from 6 leading AI providers simultaneously"
                  icon="◉"
                />
                <FeatureCard
                  title="Real-time Streaming"
                  description="Watch responses stream in with live metrics and progress"
                  icon="⚡"
                />
                <FeatureCard
                  title="Contextual Chat"
                  description="Build conversations by selecting the best response each turn"
                  icon="💬"
                />
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-16 py-6">
        <div className="max-w-[1800px] mx-auto px-6">
          <p className="text-center text-sm text-muted-foreground">
            ResponseRally — AI Benchmarking & Research Interface
          </p>
        </div>
      </footer>
    </div>
  );
};

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon }) => (
  <div className="glass-card rounded-xl p-6 text-center hover:glow-primary transition-all duration-300">
    <div className="text-3xl mb-3">{icon}</div>
    <h3 className="font-semibold mb-2 text-foreground">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

export default Index;