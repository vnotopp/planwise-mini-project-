import { useEffect, useState } from 'react';

interface ProgressRingProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string;
}

export function ProgressRing({ value, size = 120, strokeWidth = 8, className = '', label }: ProgressRingProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
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

  // Tick marks for speedometer effect
  const ticks = Array.from({ length: 20 }, (_, i) => {
    const angle = (-90 + (i / 19) * 360) * (Math.PI / 180);
    const outerR = radius + strokeWidth / 2 + 4;
    const innerR = radius + strokeWidth / 2 + 1;
    return {
      x1: size / 2 + Math.cos(angle) * innerR,
      y1: size / 2 + Math.sin(angle) * innerR,
      x2: size / 2 + Math.cos(angle) * outerR,
      y2: size / 2 + Math.sin(angle) * outerR,
    };
  });

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="hsl(215 14% 12%)" strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.5s ease-out, stroke 0.5s ease' }}
        />
      </svg>
      {/* Tick marks */}
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        {ticks.map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="hsl(215 14% 20%)" strokeWidth={1} />
        ))}
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-mono text-3xl font-bold text-foreground">{Math.round(animatedValue)}</span>
        {label && <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>}
      </div>
    </div>
  );
}
