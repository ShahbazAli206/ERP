'use client';

import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Auto-advancing, swipeable slider — used on the Dashboard for the
 * "Highlights" strip. Generic over its slide content; pass one React node
 * per slide via `slides`.
 *
 *   <Carousel slides={[<HighlightCard .../>, <HighlightCard .../>]} />
 */
export function Carousel({
  slides,
  autoplayMs = 5000,
  className,
}: {
  slides: React.ReactNode[];
  autoplayMs?: number;
  className?: string;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    onSelect();
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi || autoplayMs <= 0) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;
    const id = setInterval(() => emblaApi.scrollNext(), autoplayMs);
    return () => clearInterval(id);
  }, [emblaApi, autoplayMs]);

  if (slides.length === 0) return null;

  return (
    <div className={cn('relative', className)}>
      <div className="overflow-hidden rounded-xl" ref={emblaRef}>
        <div className="flex">
          {slides.map((slide, i) => (
            <div className="min-w-0 flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_33.333%]" key={i}>
              <div className="h-full px-1.5">{slide}</div>
            </div>
          ))}
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous"
            onClick={() => emblaApi?.scrollPrev()}
            className="glass-sm absolute top-1/2 -left-3 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-border/60 bg-background/80 text-foreground shadow-sm transition hover:scale-105 hover:bg-background"
          >
            <ChevronLeftIcon className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={() => emblaApi?.scrollNext()}
            className="glass-sm absolute top-1/2 -right-3 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-border/60 bg-background/80 text-foreground shadow-sm transition hover:scale-105 hover:bg-background"
          >
            <ChevronRightIcon className="size-4" />
          </button>
          <div className="mt-3 flex items-center justify-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => scrollTo(i)}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === selectedIndex ? 'w-6 bg-gradient-brand' : 'w-1.5 bg-foreground/20 hover:bg-foreground/35'
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
