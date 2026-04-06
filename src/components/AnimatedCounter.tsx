import { useEffect, useRef, useState } from 'react';
import { formatCurrency } from '@/store/useStore';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  isCurrency?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function AnimatedCounter({ value, duration = 1000, prefix, isCurrency = true, className = '' }: AnimatedCounterProps) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);
  const raf = useRef<number>();

  useEffect(() => {
    const start = prev.current;
    const diff = value - start;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + diff * eased;
      setDisplay(current);
      if (progress < 1) {
        raf.current = requestAnimationFrame(step);
      } else {
        prev.current = value;
      }
    };
    raf.current = requestAnimationFrame(step);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [value, duration]);

  return (
    <span className={className}>
      {prefix}
      {isCurrency ? formatCurrency(Math.round(display)) : Math.round(display).toLocaleString('en-IN')}
    </span>
  );
}
