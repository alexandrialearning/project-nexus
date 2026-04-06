import React, { useEffect, useRef } from 'react';

// themes: feminine creative force, eternal fertility, root energy, cyber nature
// visualization: Particles bloom and flow from a central source, reacting to audio

interface ParticleFlowerProps {
  intensityRef?: React.MutableRefObject<number>;
}

const ParticleFlower = ({ intensityRef }: ParticleFlowerProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<any[]>([]);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctxRef.current = ctx;

    // Scale for high DPI
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = window.innerWidth;
    const cssHeight = window.innerHeight;
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    ctx.scale(dpr, dpr);

    const centerX = cssWidth / 2;
    const centerY = cssHeight / 2;

    // Circulo equilibrado: un poco más grande que el original
    const PARTICLE_COUNT = 10000;
    const FORM_SCALE = Math.min(cssWidth, cssHeight) / 180; 
    const particles: any[] = [];
    particlesRef.current = particles;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = Math.pow(Math.random(), 0.5) * FORM_SCALE * 0.5 * 100;
      const height = (Math.random() * 2 - 1) * FORM_SCALE * 0.3;

      const angle = theta;
      const dist = r / 100;
      const flow = Math.sin(angle * 2 + height * 2) * 0.03;
      const counterFlow = Math.cos(angle * 2 - height * 2) * 0.03;
      const blend = (Math.sin(height * Math.PI) + 1) * 0.5;
      const combinedFlow = flow * blend + counterFlow * (1 - blend);

      const dx = r * Math.cos(theta);
      const dy = r * Math.sin(theta);
      const containment = Math.pow(Math.min(1, dist / (FORM_SCALE * 0.8)), 4);
      const pull = containment * 0.1;

      particles.push({
        x: centerX + dx + (dx * combinedFlow) - (dx * pull),
        y: centerY + dy + (dy * combinedFlow) - (dy * pull),
        z: height,
        initialR: r,
        initialTheta: theta,
        initialHeight: height,
        baseX: dx,
        baseY: dy
      });
    }

    let lastFrameTime = 0;
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;

    function animate(currentTime: number) {
      if (!lastFrameTime) lastFrameTime = currentTime;
      const deltaTime = currentTime - lastFrameTime;

      if (deltaTime >= frameInterval && ctx) {
        // Redujimos la velocidad de animación pasiva para que sea un movimiento hiper-suave
        timeRef.current += 0.003;

        // Intensity from audio (0 to 1+)
        const intensity = intensityRef?.current || 0;

        // Efectos muy sutiles y elegantes a petición
        const reactiveScale = 1 + (intensity * 0.08); // Expansión calcada a 8%
        const audioSpeed = 1 + (intensity * 0.1); // Apenas imperceptible aumento de rotación
        const timeVal = timeRef.current * audioSpeed;

        // Ghosting trail effect (Dark Zinc color)
        ctx.fillStyle = 'rgba(9, 9, 11, 0.15)';
        ctx.fillRect(0, 0, cssWidth, cssHeight);

        particles.forEach(particle => {
          const dx = particle.x - centerX;
          const dy = particle.y - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy) / 100;
          const angle = Math.atan2(dy, dx);
          const height = particle.z / (FORM_SCALE * 0.4);

          const flow = Math.sin(angle * 2 - timeVal * 0.5 + height * 2) * 0.015 * audioSpeed;
          const counterFlow = Math.cos(angle * 2 + timeVal * 0.5 - height * 2) * 0.015 * audioSpeed;

          const blend = (Math.sin(height * Math.PI) + 1) * 0.5;
          const combinedFlow = flow * blend + counterFlow * (1 - blend);

          const containment = Math.pow(Math.min(1, dist / (FORM_SCALE * 0.8 * reactiveScale)), 4);
          const pull = containment * 0.1;

          particle.x = particle.x + (dx * combinedFlow) - (dx * pull);
          particle.y = particle.y + (dy * combinedFlow) - (dy * pull);
          particle.z = particle.z + Math.sin(timeVal * 1.5 + dist * 2) * 0.02;

          const depthFactor = 1 + particle.z * 0.5;

          // Círculo mucho más fino: Puntos diminutos apenas visibles
          const opacity = Math.min(1, (0.15 + intensity * 0.15) * depthFactor); // Opacidad media balanceada
          const size = Math.max(0.001, (0.25 + intensity * 0.2) * depthFactor); // Tamaño visible pero fino (0.25px)

          ctx.beginPath();
          ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(128, 224, 190, ${opacity})`;
          ctx.fill();
        });

        lastFrameTime = currentTime - (deltaTime % frameInterval);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    }

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (ctxRef.current && canvasRef.current) ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      if (particlesRef.current) particlesRef.current.length = 0;
    };
  }, [intensityRef]);

  return (
    <div className="w-full h-full bg-zinc-950 overflow-hidden absolute inset-0">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};

export default ParticleFlower;
