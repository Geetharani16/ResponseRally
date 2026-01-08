import React, { useRef, useEffect, useState } from 'react';
import { ProviderResponse, ProviderType } from '@/types';
import { ResponseCard } from './ResponseCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ResponseGridProps {
  responses: ProviderResponse[];
  selectedResponseId: string | null;
  onSelectBest: (responseId: string) => void;
  onRetry: (providerId: ProviderType) => void;
}

export const ResponseGrid: React.FC<ResponseGridProps> = ({
  responses,
  selectedResponseId,
  onSelectBest,
  onRetry,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hiddenProviders, setHiddenProviders] = useState<Set<ProviderType>>(new Set());

  const updateScrollButtons = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    updateScrollButtons();
    container.addEventListener('scroll', updateScrollButtons);
    window.addEventListener('resize', updateScrollButtons);

    return () => {
      container.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [responses]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 450;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const toggleHideProvider = (providerId: ProviderType) => {
    setHiddenProviders(prev => {
      const next = new Set(prev);
      if (next.has(providerId)) {
        next.delete(providerId);
      } else {
        next.add(providerId);
      }
      return next;
    });
  };

  if (responses.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>Submit a prompt to see AI responses here</p>
      </div>
    );
  }

  // Sort: non-hidden first, then hidden
  const sortedResponses = [...responses].sort((a, b) => {
    const aHidden = hiddenProviders.has(a.provider);
    const bHidden = hiddenProviders.has(b.provider);
    if (aHidden === bHidden) return 0;
    return aHidden ? 1 : -1;
  });

  return (
    <div className="relative">
      {/* Scroll Buttons */}
      {canScrollLeft && (
        <Button
          variant="secondary"
          size="icon"
          onClick={() => scroll('left')}
          className={cn(
            'absolute left-0 top-1/2 -translate-y-1/2 z-10',
            'h-12 w-12 rounded-full shadow-lg',
            'bg-secondary/80 backdrop-blur-sm hover:bg-secondary',
            'border border-border/50'
          )}
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
      )}
      {canScrollRight && (
        <Button
          variant="secondary"
          size="icon"
          onClick={() => scroll('right')}
          className={cn(
            'absolute right-0 top-1/2 -translate-y-1/2 z-10',
            'h-12 w-12 rounded-full shadow-lg',
            'bg-secondary/80 backdrop-blur-sm hover:bg-secondary',
            'border border-border/50'
          )}
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      )}

      {/* Horizontal Scroll Container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scroll-container pb-4 px-2 -mx-2"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {sortedResponses.map((response) => (
          <div key={response.id} style={{ scrollSnapAlign: 'start' }}>
            <ResponseCard
              response={response}
              isSelected={response.id === selectedResponseId}
              isBestCandidate={selectedResponseId === null && response.status === 'success'}
              onSelectBest={() => onSelectBest(response.id)}
              onRetry={() => onRetry(response.provider)}
              isHidden={hiddenProviders.has(response.provider)}
              onToggleHide={() => toggleHideProvider(response.provider)}
            />
          </div>
        ))}
      </div>

      {/* Scroll Progress Indicator */}
      <div className="flex justify-center gap-1.5 mt-3">
        {responses.map((response, index) => (
          <div
            key={response.id}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              hiddenProviders.has(response.provider) ? 'w-1.5 bg-muted' : 'w-6 bg-primary/50'
            )}
          />
        ))}
      </div>
    </div>
  );
};
