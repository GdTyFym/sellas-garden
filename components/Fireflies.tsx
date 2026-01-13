'use client';

import { memo, useEffect, useRef } from 'react';

type Firefly = {
  x: number;
  y: number;
  radius: number;
  speed: number;
  phase: number;
  drift: number;
  amplitude: number;
};

type FirefliesProps = {
  intensity?: 'low' | 'mid' | 'high';
};

const Fireflies = memo(function Fireflies({ intensity = 'high' }: FirefliesProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId = 0;
    let width = 0;
    let height = 0;
    let particles: Firefly[] = [];
    let tick = 0;

    const density = intensity === 'low' ? 0.5 : intensity === 'mid' ? 0.75 : 1;
    const getCount = () => {
      const base = width < 640 ? 22 : width < 1024 ? 30 : 36;
      return Math.max(8, Math.round(base * density));
    };

    const createParticles = () => {
      particles = Array.from({ length: getCount() }).map(() => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 0.8 + Math.random() * 1.4,
        speed: 0.5 + Math.random() * 0.9,
        phase: Math.random() * Math.PI * 2,
        drift: -0.15 + Math.random() * 0.3,
        amplitude: 8 + Math.random() * 18
      }));
    };

    const resize = () => {
      const { innerWidth, innerHeight, devicePixelRatio } = window;
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      width = innerWidth;
      height = innerHeight;
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
      canvas.style.width = `${innerWidth}px`;
      canvas.style.height = `${innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      createParticles();
    };

    const render = () => {
      tick += 0.01;
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';
      ctx.shadowColor = 'rgba(216, 181, 107, 0.6)';
      ctx.shadowBlur = 8;

      for (const particle of particles) {
        const glow = 0.45 + Math.sin(tick * 2.4 + particle.phase) * 0.35;
        const yOffset = Math.sin(tick * particle.speed + particle.phase) * particle.amplitude;
        const xOffset = Math.cos(tick * 0.8 + particle.phase) * 1.2;

        particle.x += particle.drift * 0.4 + xOffset * 0.02;
        particle.y += Math.cos(tick * 0.6 + particle.phase) * 0.02;

        if (particle.x < -20) particle.x = width + 20;
        if (particle.x > width + 20) particle.x = -20;
        if (particle.y < -20) particle.y = height + 20;
        if (particle.y > height + 20) particle.y = -20;

        ctx.beginPath();
        ctx.fillStyle = `rgba(216, 181, 107, ${glow})`;
        ctx.arc(particle.x, particle.y + yOffset, particle.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animationId = window.requestAnimationFrame(render);
    };

    resize();
    window.addEventListener('resize', resize);
    animationId = window.requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      window.cancelAnimationFrame(animationId);
    };
  }, [intensity]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0"
      aria-hidden="true"
    />
  );
});

export default Fireflies;
