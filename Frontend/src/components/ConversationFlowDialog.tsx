import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ZoomIn, ZoomOut, Move, Maximize2, BarChart2 } from 'lucide-react';
import { SessionState } from '@/types';

interface ConversationFlowDialogProps {
  isOpen: boolean;
  onClose: () => void;
  session: SessionState;
}

const ConversationFlowDialog: React.FC<ConversationFlowDialogProps> = ({
  isOpen,
  onClose,
  session,
}) => {
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [scale, setScale] = useState<number>(1);

  const [showMetrics, setShowMetrics] = useState(true);

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const resetView = () => {
    setScale(1);
  };

  // Add scroll zoom
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setScale(prev => Math.max(0.3, Math.min(prev + delta, 3)));
      }
    };

    const container = svgContainerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  // Function to generate SVG based on session data
  useEffect(() => {
    if (!isOpen) return;

    const renderSmoothSVG = () => {
      const width = 1600; // Increased width for better spacing
      const height = Math.max(800, session.conversationHistory.length * 250); // Dynamic height
      
      let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" style="background: #ffffff; font-family: 'Inter', -apple-system, sans-serif; min-height: ${height}px; height: auto;">
        <style>
          .node { }
          .prompt-node { }
          .provider-node { }
          .connection { stroke-linecap: round; stroke-linejoin: round; }
          .selected-connection { filter: drop-shadow(0 2px 4px rgba(139, 92, 246, 0.6)); }
          .selected-node { }
          .node { }
          .disabled { opacity: 0.6; }
          text { user-select: none; font-weight: 700; }
          .node-circle { transition: all 0.2s ease; }
        </style>
        <defs>
          <linearGradient id="promptGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#0284c7;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#0ea5e9;stop-opacity:1" />
          </linearGradient>
          <linearGradient id="selectedProviderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#7c3aed;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
          </linearGradient>
          <linearGradient id="providerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#e2e8f0;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#cbd5e1;stop-opacity:1" />
          </linearGradient>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
          </marker>
          <marker id="selectedArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#8b5cf6" />
          </marker>
        </defs>`;
      
      // Calculate positions for prompts (correct vertical layout)
      const promptCount = session.conversationHistory.length;
      const promptSpacing = 320; // Increased vertical spacing between prompt and its responses
      
      session.conversationHistory.forEach((turn, index) => {
        // Each prompt is positioned below its selected model from the previous turn
        const y = 100 + (index * promptSpacing); // Fixed spacing
        const x = width / 2;
        
        // Draw prompt node with gradient and shadow
        const promptText = `Prompt ${index + 1}`;
        
        svg += `
          <g class="node prompt-node" data-tooltip="${turn.userPrompt.replace(/"/g, '&quot;').replace(/\n/g, '<br>')}" transform="translate(${x}, ${y})">
            <circle r="50" fill="url(#promptGradient)" stroke="#0c4a6e" stroke-width="4" class="node-circle" />
            <circle r="50" fill="transparent" stroke="url(#promptGradient)" stroke-width="15" stroke-opacity="0.2" />
            <text text-anchor="middle" font-size="14" font-weight="700" fill="white" dy="6">
              <tspan x="0" dy="-6">Prompt</tspan>
              <tspan x="0" dy="20">${index + 1}</tspan>
            </text>
          </g>
        `;
        
        // Draw provider nodes horizontally aligned below the prompt
        const providers = ['ChatGPT', 'Gemini', 'LLaMA', 'Mistral', 'Copilot', 'DeepSeek'];
        const providerSpacing = width / (providers.length + 1);
        const providerY = y + 140; // Increased space between prompt and providers
        
        providers.forEach((provider, pIdx) => {
          const providerX = (pIdx + 1) * providerSpacing;
          
          // Check if this provider was part of the responses for this turn
          const providerIdMap: Record<string, import('@/types').ProviderType> = {
            'ChatGPT': 'gpt',
            'Gemini': 'gemini',
            'LLaMA': 'llama',
            'Mistral': 'mistral',
            'Copilot': 'copilot',
            'DeepSeek': 'deepseek'
          };
          const providerId = providerIdMap[provider];
          
          const responseExists = turn.allResponses.some(resp => resp.provider === providerId);
          if (!responseExists) return;
          
          const isSelectedProvider = turn.selectedResponse?.provider === providerId;
          const isProviderEnabled = session.enabledProviders.includes(providerId);
          const response = turn.allResponses.find(r => r.provider === providerId);
          
          if (!response) return; // Skip if no response found
          const metrics = response?.metrics;
          
          // Format metrics for tooltip
          const metricsText = metrics ? `
Metrics:
• Latency: ${metrics.latencyMs}ms
• Tokens: ${metrics.tokenCount || 0}
• Speed: ${(metrics.tokensPerSecond || 0).toFixed(1)} tokens/sec` : '';
          
          const cssClass = `node provider-node ${isSelectedProvider ? 'selected-node' : ''} ${isProviderEnabled ? '' : 'disabled'}`;
          const gradientId = isSelectedProvider ? 'selectedProviderGradient' : 'providerGradient';
          const strokeColor = isSelectedProvider ? '#7c3aed' : '#cbd5e1';
          
          svg += `
            <g class="${cssClass}" data-tooltip="${(response?.response.substring(0, 120) || '').replace(/"/g, '&quot;').replace(/\n/g, '<br>')}...${metricsText}" transform="translate(${providerX}, ${providerY})">
              <rect x="-40" y="-35" width="80" height="70" rx="15" fill="url(#${gradientId})" stroke="${strokeColor}" stroke-width="2.5" class="node-circle" />
              <text text-anchor="middle" font-size="12" font-weight="600" fill="${isSelectedProvider ? 'white' : '#374151'}" dy="5">${provider}</text>
            </g>
          `;
          
          // Draw orthogonal rounded connection from prompt to provider
          const connectionClass = `connection ${isSelectedProvider ? 'selected-connection' : ''}`;
          
          // Orthogonal path: straight down from prompt, then horizontal to provider
          svg += `
            <path class="${connectionClass}" 
                  d="M ${x},${y + 50} 
                     C ${x},${y + 100} ${providerX},${y + 100} ${providerX},${providerY - 35}" 
                  fill="none" 
                  stroke="${isSelectedProvider ? '#7c3aed' : '#94a3b8'}" 
                  stroke-width="${isSelectedProvider ? 3 : 2}" 
                  stroke-dasharray="${isSelectedProvider ? 'none' : '6,4'}"
                  marker-end="none" />
          `;
        });
        
        // Draw orthogonal connection from selected provider to next prompt
        if (index < session.conversationHistory.length - 1 && turn.selectedResponse) {
          // Find the selected provider position
          let selectedProviderName: string = turn.selectedResponse.provider;
          switch(turn.selectedResponse.provider) {
            case 'gpt': selectedProviderName = 'ChatGPT'; break;
            case 'gemini': selectedProviderName = 'Gemini'; break;
            case 'llama': selectedProviderName = 'LLaMA'; break;
            case 'mistral': selectedProviderName = 'Mistral'; break;
            case 'copilot': selectedProviderName = 'Copilot'; break;
            case 'deepseek': selectedProviderName = 'DeepSeek'; break;
          }
          
          const providers = ['ChatGPT', 'Gemini', 'LLaMA', 'Mistral', 'Copilot', 'DeepSeek'];
          const providerIndex = providers.indexOf(selectedProviderName);
          const providerSpacing = width / (providers.length + 1);
          const selectedProviderX = (providerIndex + 1) * providerSpacing;
          const selectedProviderY = providerY;
          
          const nextPromptY = 100 + ((index + 1) * promptSpacing); // Next prompt position
          
          // Orthogonal curved path from selected provider to next prompt
          svg += `
            <path class="connection selected-connection" 
                  d="M ${selectedProviderX},${selectedProviderY + 35} 
                     C ${selectedProviderX},${selectedProviderY + 100} ${x},${selectedProviderY + 100} ${x},${nextPromptY - 50}" 
                  fill="none" 
                  stroke="#7c3aed" 
                  stroke-width="3" 
                  marker-end="none" 
                  style="stroke-linecap: round; stroke-linejoin: round;" />
          `;
        }
      });
      
      svg += `</svg>`;
      
      return svg;
    };

    setSvgContent(renderSmoothSVG());
    // Reset view when new session data loads
    resetView();
  }, [isOpen, session]);

  // Function to calculate and display metrics summary
  const renderMetricsSummary = () => {
    if (!session.conversationHistory.length) return null;
    
    // Calculate aggregate metrics
    const allResponses = session.conversationHistory.flatMap(turn => turn.allResponses);
    const successfulResponses = allResponses.filter(r => r.status === 'success');
    
    const avgLatency = successfulResponses.reduce((sum, r) => sum + (r.metrics.latencyMs || 0), 0) / Math.max(successfulResponses.length, 1);
    const avgTokens = successfulResponses.reduce((sum, r) => sum + (r.metrics.tokenCount || 0), 0) / Math.max(successfulResponses.length, 1);
    const avgTokensPerSec = successfulResponses.reduce((sum, r) => sum + (r.metrics.tokensPerSecond || 0), 0) / Math.max(successfulResponses.length, 1);
    
    const providerStats: Record<string, any> = {};
    allResponses.forEach(response => {
      if (!providerStats[response.provider]) {
        providerStats[response.provider] = {
          count: 0,
          success: 0,
          totalLatency: 0,
          totalTokens: 0
        };
      }
      
      providerStats[response.provider].count++;
      if (response.status === 'success') {
        providerStats[response.provider].success++;
        providerStats[response.provider].totalLatency += response.metrics.latencyMs || 0;
        providerStats[response.provider].totalTokens += response.metrics.tokenCount || 0;
      }
    });
    
    return (
      <div className={`transition-all duration-300 ${showMetrics ? 'w-72 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
        <div className="w-72 h-full p-4 bg-gradient-to-b from-white to-gray-50 border-l border-gray-200 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <BarChart2 className="h-5 w-5" />
              Metrics Summary
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setShowMetrics(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-4">
            <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
              <div className="font-semibold text-sm text-gray-700 mb-2">Overall Stats</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-600">Total Responses</div>
                <div className="font-medium text-right">{allResponses.length}</div>
                
                <div className="text-gray-600">Successful</div>
                <div className="font-medium text-right text-green-600">{successfulResponses.length}</div>
                
                <div className="text-gray-600">Avg. Latency</div>
                <div className="font-medium text-right">{avgLatency.toFixed(0)}ms</div>
                
                <div className="text-gray-600">Avg. Tokens</div>
                <div className="font-medium text-right">{avgTokens.toFixed(0)}</div>
                
                <div className="text-gray-600">Tokens/sec</div>
                <div className="font-medium text-right">{avgTokensPerSec.toFixed(1)}</div>
              </div>
            </div>
            
            <div className="p-3 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-100">
              <div className="font-semibold text-sm text-gray-700 mb-2">By Provider</div>
              <div className="space-y-3">
                {Object.entries(providerStats).map(([provider, stats]: [any, any]) => {
                  const avgLatency = stats.success > 0 ? (stats.totalLatency / stats.success) : 0;
                  const avgTokens = stats.success > 0 ? (stats.totalTokens / stats.success) : 0;
                  const successRate = (stats.success / stats.count) * 100;
                  
                  // Map provider ID to display name
                  let displayName = provider;
                  switch(provider) {
                    case 'gpt': displayName = 'ChatGPT'; break;
                    case 'gemini': displayName = 'Gemini'; break;
                    case 'llama': displayName = 'LLaMA'; break;
                    case 'mistral': displayName = 'Mistral'; break;
                    case 'copilot': displayName = 'Copilot'; break;
                    case 'deepseek': displayName = 'DeepSeek'; break;
                  }
                  
                  return (
                    <div key={provider} className="p-2 bg-white rounded border hover:bg-gray-50 transition-colors">
                      <div className="font-medium text-sm text-gray-800">{displayName}</div>
                      <div className="flex items-center justify-between text-xs text-gray-600 mt-1">
                        <span className={`px-1.5 py-0.5 rounded ${successRate >= 90 ? 'bg-green-100 text-green-800' : successRate >= 70 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                          {successRate.toFixed(0)}% success
                        </span>
                        <span>{avgLatency.toFixed(0)}ms</span>
                        <span>{avgTokens.toFixed(0)} tokens</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-[calc(100vh-100px)] p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-gray-50 to-slate-50">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Conversation Flow Visualization</h2>
              <p className="text-sm text-gray-600 mt-1">
                Follow the selected path through prompts and model responses
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!showMetrics && (
                <Button onClick={() => setShowMetrics(true)} variant="outline" size="sm" className="gap-2">
                  <BarChart2 className="h-4 w-4" />
                  Show Metrics
                </Button>
              )}
              <div className="flex items-center gap-1 bg-white border rounded-lg p-1">
                <Button onClick={zoomOut} variant="ghost" size="icon" className="h-8 w-8">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium px-2">{Math.round(scale * 100)}%</span>
                <Button onClick={zoomIn} variant="ghost" size="icon" className="h-8 w-8">
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button onClick={resetView} variant="ghost" size="icon" className="h-8 w-8">
                  <Maximize2 className="h-4 w-4" />
                </Button>

              </div>
              <Button onClick={onClose} variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex-1 flex overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50/30">
            <div 
              ref={svgContainerRef}
              className="flex-1 overflow-y-auto overflow-x-auto relative"
              style={{ cursor: 'default', maxHeight: 'none' }}
            >
              <div 
                className="w-full flex justify-center pt-8 pb-8"
                style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}
              >
                <div 
                  className="bg-white rounded-xl p-4"
                  style={{
                    transform: `scale(${scale})`,
                    transformOrigin: 'center',
                    transition: 'transform 0.2s ease-out',
                    minWidth: 'fit-content',
                    minHeight: 'fit-content',
                    overflow: 'visible',
                    alignSelf: 'center'
                  }}
                  dangerouslySetInnerHTML={{ __html: svgContent }}
                />
              </div>
              
              {/* Overlay instructions */}
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg border shadow-sm">
                <div className="text-xs text-gray-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-500"></div>
                    <span>Prompt nodes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-400 to-purple-500"></div>
                    <span>Selected responses</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart2 className="h-3 w-3" />
                    <span>Scroll to zoom • Vertical scroll to navigate</span>
                  </div>
                </div>
              </div>
            </div>
            
            {renderMetricsSummary()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConversationFlowDialog;