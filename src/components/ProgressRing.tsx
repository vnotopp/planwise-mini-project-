import { useEffect, useState } from 'react';

interface ProgressRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string;
}

export function ProgressRing({ value, size = 180, strokeWidth = 10, className = '', label }: ProgressRingProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; // semicircle
  const offset = circumference - (animatedValue / 100) * circumference;

  const color = animatedValue >= 75
    ? 'hsl(160 84% 39%)'
    : animatedValue >= 50
      ? 'hsl(43 88% 55%)'
      : animatedValue >= 25
        ? 'hsl(30 90% 50%)'
        : 'hsl(0 84% 60%)';

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(Math.min(100, Math.max(0, value))), 100);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className={`relative inline-flex flex-col items-center justify-center ${className}`}>
      <svg width={size} height={size / 2 + strokeWidth} viewBox={`0 0 ${size} ${size / 2 + strokeWidth}`}>
        {/* Background arc */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke="hsl(0 0% 12%)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.5s ease-out, stroke 0.5s ease' }}
        />
      </svg>
      <div className="absolute bottom-0 flex flex-col items-center">
        <span className="font-mono text-3xl font-bold text-foreground">{Math.round(animatedValue)}</span>
        {label && <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>}
      </div>
    </div>
  );
}
