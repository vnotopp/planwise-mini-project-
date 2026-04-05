import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

interface Star {
  x: number;
  y: number;
  size: number;
  baseOpacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  color: string;
  driftX: number;
  driftY: number;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const lastShootRef = useRef(0);
  const animRef = useRef<number>(0);
  const location = useLocation();
  const isDashboard = location.pathname === '/';

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const STAR_COUNT = isMobile ? 100 : 200;

  const initStars = useCallback((w: number, h: number) => {
    const colors = [
      ...Array(14).fill('#ffffff'),
      ...Array(4).fill('#93C5FD'),
      ...Array(2).fill('#F0B429'),
    ];
    starsRef.current = Array.from({ length: STAR_COUNT }, () => {
      const isDrifting = Math.random() < 0.1;
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        size: [0.5, 1, 1.5][Math.floor(Math.random() * 3)],
        baseOpacity: 0.3 + Math.random() * 0.7,
        twinkleSpeed: 0.5 + Math.random() * 2,
        twinkleOffset: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        driftX: isDrifting ? (Math.random() - 0.5) * 0.15 : 0,
        driftY: isDrifting ? (Math.random() - 0.5) * 0.1 : 0,
      };
    });
  }, [STAR_COUNT]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (starsRef.current.length === 0) initStars(canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const animate = (time: number) => {
      const t = time / 1000;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Stars
      for (const star of starsRef.current) {
        star.x += star.driftX;
        star.y += star.driftY;
        if (star.x < 0) star.x = canvas.width;
        if (star.x > canvas.width) star.x = 0;
        if (star.y < 0) star.y = canvas.height;
        if (star.y > canvas.height) star.y = 0;

        const opacity = 0.2 + (star.baseOpacity - 0.2) * (0.5 + 0.5 * Math.sin(t * star.twinkleSpeed + star.twinkleOffset));
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = opacity;
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Shooting stars (desktop only)
      if (!isMobile) {
        if (time - lastShootRef.current > (4000 + Math.random() * 4000) && shootingStarsRef.current.length < 2) {
          lastShootRef.current = time;
          shootingStarsRef.current.push({
            x: canvas.width * 0.6 + Math.random() * canvas.width * 0.4,
            y: Math.random() * canvas.height * 0.3,
            vx: -(3 + Math.random() * 2),
            vy: 2 + Math.random() * 1.5,
            life: 0,
            maxLife: 48,
          });
        }

        shootingStarsRef.current = shootingStarsRef.current.filter((s) => {
          s.x += s.vx;
          s.y += s.vy;
          s.life++;
          const progress = s.life / s.maxLife;
          const alpha = 1 - progress;

          const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 20, s.y - s.vy * 20);
          grad.addColorStop(0, `rgba(255,255,255,${alpha})`);
          grad.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x - s.vx * 20, s.y - s.vy * 20);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          return s.life < s.maxLife;
        });
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [initStars, isMobile]);

  return (
    <div className="fixed inset-0 pointer-events-none dark:block hidden" style={{ zIndex: -1 }}>
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Floating Orbs */}
      <div
        className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full animate-float will-change-transform"
        style={{ background: 'radial-gradient(circle, hsl(212 50% 24%), transparent)', filter: 'blur(80px)', opacity: 0.25 }}
      />
      <div
        className="absolute bottom-[-10%] right-[-5%] w-[300px] h-[300px] rounded-full animate-float-reverse will-change-transform"
        style={{ background: 'radial-gradient(circle, hsl(212 50% 20%), transparent)', filter: 'blur(80px)', opacity: 0.25 }}
      />
      <div
        className="absolute top-[30%] right-[10%] w-[250px] h-[250px] rounded-full animate-pulse-slow will-change-transform"
        style={{ background: 'radial-gradient(circle, hsl(36 60% 16%), transparent)', filter: 'blur(80px)', opacity: 0.25 }}
      />

      {/* Dashboard-only nebula */}
      {isDashboard && (
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute top-1/2 left-1/2 w-[800px] h-[800px] -translate-x-1/2 -translate-y-1/2"
            style={{
              background: 'radial-gradient(ellipse, hsl(174 96% 6%) 0%, transparent 70%)',
              opacity: 0.15,
              animation: 'spin 60s linear infinite',
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2"
            style={{
              background: 'radial-gradient(ellipse, hsl(212 40% 14%) 0%, transparent 70%)',
              opacity: 0.12,
              animation: 'spin 60s linear infinite reverse',
            }}
          />
        </div>
      )}

      {isDashboard && (
        <div
          className="absolute top-0 left-0 w-full h-[50vh]"
          style={{
            background: 'radial-gradient(ellipse at 20% 0%, hsl(43 88% 55% / 0.04) 0%, transparent 50%), radial-gradient(ellipse at 80% 10%, hsl(187 92% 41% / 0.03) 0%, transparent 50%)',
          }}
        />
      )}
    </div>
  );
}

// Particle burst utility
export function createParticleBurst(x: number, y: number, colors: string[] = ['#F0B429', '#06B6D4', '#ffffff']) {
  const count = colors.length > 2 ? 20 : 15;
  const container = document.createElement('div');
  container.style.cssText = `position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:9999;`;
  document.body.appendChild(container);

  for (let i = 0; i < count; i++) {
    const dot = document.createElement('div');
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const velocity = 80 + Math.random() * 120;
    const color = colors[i % colors.length];
    const size = 3 + Math.random() * 4;

    dot.style.cssText = `
      position:absolute;left:${x}px;top:${y}px;width:${size}px;height:${size}px;
      border-radius:50%;background:${color};
      transform:translate(-50%,-50%);
      animation:particle-fly 0.8s ease-out forwards;
      --tx:${Math.cos(angle) * velocity}px;
      --ty:${Math.sin(angle) * velocity}px;
    `;
    container.appendChild(dot);
  }

  // Add particle keyframes if not present
  if (!document.getElementById('particle-styles')) {
    const style = document.createElement('style');
    style.id = 'particle-styles';
    style.textContent = `
      @keyframes particle-fly {
        0% { opacity:1; transform:translate(-50%,-50%) translate(0,0) scale(1); }
        100% { opacity:0; transform:translate(-50%,-50%) translate(var(--tx),var(--ty)) scale(0); }
      }
    `;
    document.head.appendChild(style);
  }

  setTimeout(() => container.remove(), 1000);
}
