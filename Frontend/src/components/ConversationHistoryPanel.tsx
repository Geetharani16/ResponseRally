import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X, MessageCircle, Clock, Trash2, Plus, User, Search, LogOut, Edit3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ConversationTurn, SessionState } from '@/types';
import { getUserConversations } from '@/lib/api';

interface StoredConversation {
  id: string;
  title: string;
  turns: ConversationTurn[];
  createdAt: number;
  lastUpdated: number;
  providerCount: number;
}

interface ConversationHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadConversation: (conversation: StoredConversation) => void;
  onLogout?: () => void;
  currentSession: SessionState;
}

export const ConversationHistoryPanel: React.FC<ConversationHistoryPanelProps> = ({
  isOpen,
  onClose,
  onLoadConversation,
  onLogout,
  currentSession
}) => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<StoredConversation[]>([]);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [username, setUsername] = useState<string>('');

  // Get username from localStorage on mount and update when auth changes
  useEffect(() => {
    const storedUsername = localStorage.getItem('username') || 'User';
    setUsername(storedUsername);
  }, []);

  // Update username when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const storedUsername = localStorage.getItem('username') || 'User';
      setUsername(storedUsername);
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Close panel with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Load conversations from localStorage and backend on mount
  useEffect(() => {
    loadConversations();
  }, []);



  // Auto-save current conversation when it changes
  useEffect(() => {
    if (currentSession.conversationHistory.length > 0) {
      saveCurrentConversation();
    }
  }, [currentSession.conversationHistory]);

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      // Check if user is authenticated
      const userId = localStorage.getItem('userId');
      
      if (userId) {
        try {
          // Fetch user-specific conversations from backend (MongoDB only)
          const response = await getUserConversations(userId);
          
          // Process backend responses to create conversation objects
          const backendConversations: StoredConversation[] = [];
          
          // Type guard to check if response has the expected structure
          if (response && typeof response === 'object' && 'responses' in response && Array.isArray(response.responses)) {
            // Group responses by conversation/session to form conversation turns
            const conversationMap = new Map();
            
            // First, group responses by conversationId
            (response.responses as any[]).forEach((res: any) => {
              if (res.conversationId) {
                if (!conversationMap.has(res.conversationId)) {
                  conversationMap.set(res.conversationId, {
                    id: res.conversationId,
                    title: res.prompt || res.userPrompt || 'Untitled Conversation',
                    turns: [],
                    createdAt: Date.now(),
                    lastUpdated: Date.now(),
                    providerCount: 0
                  });
                }
                
                const conv = conversationMap.get(res.conversationId);
                
                // Add response to the conversation turn
                if (!conv.turns.some((turn: any) => turn.userPrompt === res.prompt || turn.userPrompt === res.userPrompt)) {
                  conv.turns.push({
                    id: res.conversationId,
                    userPrompt: res.prompt || res.userPrompt,
                    selectedResponse: res,
                    allResponses: [res],
                    timestamp: res.createdAt || res.timestamp || Date.now()
                  });
                }
              }
            });
            
            // Convert map to array and add to backend conversations
            conversationMap.forEach((conv: any) => {
              conv.providerCount = new Set(conv.turns.flatMap((turn: any) => 
                turn.allResponses?.map((r: any) => r.provider) || []
              )).size;
              backendConversations.push(conv);
            });
          }
          
          // Use only backend conversations (MongoDB only approach)
          const sortedConversations = backendConversations.sort((a, b) => 
            b.lastUpdated - a.lastUpdated
          );
          
          setConversations(sortedConversations);
          
          // Update conversation count in header
          window.dispatchEvent(new CustomEvent('rr-conversation-count', {
            detail: sortedConversations.length
          }));
        } catch (backendError) {
          console.error('Error fetching user conversations from backend:', backendError);
          
          // Show empty state if backend fails
          setConversations([]);
          window.dispatchEvent(new CustomEvent('rr-conversation-count', {
            detail: 0
          }));
        }
      } else {
        // No user authenticated - show empty state instead of localStorage
        setConversations([]);
        window.dispatchEvent(new CustomEvent('rr-conversation-count', {
          detail: 0
        }));
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCurrentConversation = async () => {
    if (currentSession.conversationHistory.length === 0) return;

    try {
      const title = currentSession.conversationHistory[0]?.userPrompt?.substring(0, 50) || 'Untitled Conversation';
      const conversationId = `conv_${currentSession.id}`;
      
      const newConversation: StoredConversation = {
        id: conversationId,
        title,
        turns: currentSession.conversationHistory,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
        providerCount: new Set(currentSession.conversationHistory.flatMap(turn => 
          turn.allResponses?.map(r => r.provider) || []
        )).size
      };

      // Since we're MongoDB-only, we don't save to localStorage
      // The conversation is already stored in the backend session
      
      // Update the conversation list with the new conversation
      const updatedConversations = conversations.filter(conv => conv.id !== conversationId);
      updatedConversations.unshift(newConversation);
      
      // Keep only last 50 conversations
      const trimmedConversations = updatedConversations.slice(0, 50);
      
      setConversations(trimmedConversations);
      
      // Update conversation count
      window.dispatchEvent(new CustomEvent('rr-conversation-count', {
        detail: trimmedConversations.length
      }));
      
      // The conversation is automatically stored in MongoDB through the session system
      // No additional action needed here
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  };

  const handleLoadConversation = (conversation: StoredConversation) => {
    onLoadConversation(conversation);
    onClose();
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(id);
    
    try {
      const updatedConversations = conversations.filter(conv => conv.id !== id);
      setConversations(updatedConversations);
      
      // Update conversation count
      window.dispatchEvent(new CustomEvent('rr-conversation-count', {
        detail: updatedConversations.length
      }));
      
      // In a full implementation, we would call a backend API to delete the conversation
      // For now, the deletion is handled locally but will be refetched on next load
    } catch (error) {
      console.error('Error deleting conversation:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleStartRename = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRenaming(id);
    setRenameValue(currentTitle);
  };

  const handleRenameSubmit = async (id: string, e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!renameValue.trim()) return;
    
    try {
      const updatedConversations = conversations.map(conv => 
        conv.id === id 
          ? { ...conv, title: renameValue.trim(), lastUpdated: Date.now() }
          : conv
      );
      
      setConversations(updatedConversations);
      setIsRenaming(null);
      setRenameValue('');
      
      // In a full implementation, we would call a backend API to rename the conversation
      // For now, the update is handled locally but will be refetched on next load
    } catch (error) {
      console.error('Error renaming conversation:', error);
    }
  };

  const handleRenameCancel = () => {
    setIsRenaming(null);
    setRenameValue('');
  };
  const handleNewConversation = () => {
    window.dispatchEvent(new CustomEvent('rr-new-session'));
    onClose();
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    // Clear user data and reload conversations
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    loadConversations();
    onClose();
  };

  const handleUserProfile = () => {
    // Navigate to profile page
    navigate('/profile');
    onClose(); // Close the panel after navigation
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - timestamp) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conv => 
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.turns.some(turn => 
      turn.userPrompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      turn.selectedResponse?.response.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Combined Backdrop and Panel Container */}
      <div 
        className="fixed inset-0 z-[9999]"
        onClick={(e) => {
          // Close only if clicking directly on the backdrop (not on panel children)
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        {/* Panel - Instant show/hide */}
        <div 
          className={cn(
            "fixed left-0 top-0 h-screen w-80 bg-background border-r border-border shadow-2xl",
            isOpen ? "block" : "hidden"
          )}
        >
          <div className="flex flex-col h-full">
            {/* Header - User Profile Section with 19x19 Icon */}
            <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
              <button
                onClick={handleUserProfile}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-all duration-300"
                aria-label="View profile"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                  <User className="w-8 h-8 text-primary-foreground" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-foreground">{username}</div>
                  <div className="text-xs text-muted-foreground">View Profile</div>
                </div>
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-muted transition-colors duration-200"
                aria-label="Close panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar - Fixed below header */}
            <div className="p-3 border-b border-border shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all duration-200"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* New Conversation Button - Fixed below search */}
            <div className="p-3 border-b border-border shrink-0">
              <button
                onClick={handleNewConversation}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-all duration-200"
              >
                <Plus className="w-5 h-5 text-primary" />
                <span className="font-medium">New Conversation</span>
              </button>
            </div>

            {/* Conversations List - Vertically Scrollable Middle Section */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">Loading conversations...</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    {searchQuery ? 'No matching conversations' : 'No conversations yet'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery 
                      ? 'Try adjusting your search terms' 
                      : 'Your conversation history will appear here once you start chatting'
                    }
                  </p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className="group relative flex items-start gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-all duration-200"
                      onClick={() => isRenaming !== conversation.id && handleLoadConversation(conversation)}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <MessageCircle className="w-4 h-4 text-primary" />
                        </div>
                      </div>
                                      
                      <div className="flex-1 min-w-0">
                        {isRenaming === conversation.id ? (
                          <form onSubmit={(e) => handleRenameSubmit(conversation.id, e)} className="flex-1">
                            <input
                              type="text"
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onBlur={handleRenameCancel}
                              autoFocus
                              className="w-full px-2 py-1 text-sm border border-primary rounded focus:outline-none focus:ring-1 focus:ring-primary bg-background"
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                  handleRenameCancel();
                                } else if (e.key === 'Enter') {
                                  handleRenameSubmit(conversation.id, e as any);
                                }
                              }}
                            />
                          </form>
                        ) : (
                          <>
                            <h3 className="font-medium text-foreground truncate">
                              {conversation.title}
                            </h3>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDate(conversation.lastUpdated)}
                              </span>
                              <span>
                                {conversation.turns.length} {conversation.turns.length === 1 ? 'turn' : 'turns'}
                              </span>
                              {conversation.providerCount > 0 && (
                                <span>
                                  {conversation.providerCount} {conversation.providerCount === 1 ? 'provider' : 'providers'}
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                                      
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => handleStartRename(conversation.id, conversation.title, e)}
                          disabled={isRenaming !== null}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-accent/10 text-muted-foreground hover:text-accent transition-all duration-200"
                          aria-label="Rename conversation"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteConversation(conversation.id, e)}
                          disabled={isDeleting === conversation.id || isRenaming !== null}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all duration-200"
                          aria-label="Delete conversation"
                        >
                          {isDeleting === conversation.id ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer - Fixed at bottom */}
            <div className="p-3 border-t border-border text-xs text-muted-foreground shrink-0">
              <div className="flex items-center justify-between">
                <span>
                  {searchQuery 
                    ? `${filteredConversations.length} of ${conversations.length} conversations` 
                    : `${conversations.length} conversations`
                  }
                </span>
                <div className="flex items-center gap-3">
                  {onLogout && (
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors duration-200 p-1 rounded hover:bg-muted"
                      aria-label="Logout"
                    >
                      <LogOut className="w-3 h-3" />
                      <span className="text-xs">Logout</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};