import { useEffect, useRef, memo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface Props {
  size?: number;
  opacity?: number;
  className?: string;
}

interface Blob {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hue: number;
}

function createBlobs(w: number, h: number): Blob[] {
  return Array.from({ length: 6 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 1.6,
    vy: (Math.random() - 0.5) * 1.6,
    radius: 150 + Math.random() * 130,
    hue: Math.random() * 360,
  }));
}

const COLORS = [
  [255, 255, 255],
  [0, 255, 255],
  [255, 215, 0],
  [155, 89, 182],
  [0, 191, 255],
  [255, 100, 150],
];

export const LiquidChromeBackground = memo(function LiquidChromeBackground({
  size = 600,
  opacity = 0.35,
  className = '',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isMobile = useIsMobile();
  const effectiveSize = isMobile ? 250 : size;
  const effectiveOpacity = isMobile ? 0.15 : opacity;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = effectiveSize;
    canvas.height = effectiveSize;

    const blobs = createBlobs(effectiveSize, effectiveSize);
    let frameHue = 0;
    let animId = 0;
    let lastTime = 0;
    let paused = false;

    const onVisibility = () => {
      paused = document.hidden;
      if (!paused) {
        lastTime = 0;
        animId = requestAnimationFrame(loop);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    function loop(time: number) {
      if (paused) return;
      if (lastTime && time - lastTime < 16) {
        animId = requestAnimationFrame(loop);
        return;
      }
      lastTime = time;
      frameHue = (frameHue + 0.5) % 360;

      ctx!.clearRect(0, 0, effectiveSize, effectiveSize);
      ctx!.globalCompositeOperation = 'screen';

      for (let i = 0; i < blobs.length; i++) {
        const b = blobs[i];
        b.x += b.vx;
        b.y += b.vy;
        if (b.x - b.radius < 0 || b.x + b.radius > effectiveSize) b.vx *= -1;
        if (b.y - b.radius < 0 || b.y + b.radius > effectiveSize) b.vy *= -1;

        const c = COLORS[i % COLORS.length];
        const grad = ctx!.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius);
        grad.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},0.6)`);
        grad.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
        ctx!.fillStyle = grad;
        ctx!.beginPath();
        ctx!.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx!.fill();
      }

      // Displacement mesh
      ctx!.globalCompositeOperation = 'source-over';
      const gridSize = 20;
      const cellW = effectiveSize / gridSize;
      const cellH = effectiveSize / gridSize;
      ctx!.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx!.lineWidth = 0.5;
      const t = time * 0.001;

      for (let gx = 0; gx <= gridSize; gx++) {
        ctx!.beginPath();
        for (let gy = 0; gy <= gridSize; gy++) {
          const px = gx * cellW + Math.sin(t + gy * 0.3) * 4;
          const py = gy * cellH + Math.cos(t + gx * 0.3) * 4;
          if (gy === 0) ctx!.moveTo(px, py);
          else ctx!.lineTo(px, py);
        }
        ctx!.stroke();
      }

      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [effectiveSize]);

  return (
    <div
      className={`chrome-container pointer-events-none absolute ${className}`}
      style={{
        width: effectiveSize,
        height: effectiveSize,
        opacity: effectiveOpacity,
        willChange: 'transform',
        transition: 'opacity 1s ease',
        overflow: 'hidden',
        borderRadius: 'inherit',
      }}
    >
      <img
        src="/chromebg.gif"
        alt=""
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          mixBlendMode: 'screen',
          filter: 'saturate(180%) brightness(120%) contrast(130%)',
        }}
      />
    </div>
  );
});
