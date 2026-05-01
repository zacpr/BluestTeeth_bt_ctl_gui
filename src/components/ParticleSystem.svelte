<script>
  import { onMount, onDestroy } from 'svelte';

  let canvas;
  let ctx;
  let animationFrame;
  let particles = [];
  let mouse = { x: 0, y: 0 };
  let particleCount = 50;
  let connectionDistance = 120;
  let mouseRadius = 150;

  // Particle class
  class Particle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.vx = (Math.random() - 0.5) * 0.5;
      this.vy = (Math.random() - 0.5) * 0.5;
      this.size = Math.random() * 3 + 1;
      this.alpha = Math.random() * 0.8 + 0.2;
      this.color = this.getRandomColor();
      this.connections = [];
    }

    getRandomColor() {
      const colors = [
        'rgba(0, 212, 255, 0.6)', // Blue
        'rgba(0, 255, 157, 0.6)', // Green
        'rgba(255, 107, 53, 0.6)', // Orange
        'rgba(255, 71, 87, 0.6)',  // Red
        'rgba(156, 39, 176, 0.6)', // Purple
      ];
      return colors[Math.floor(Math.random() * colors.length)];
    }

    update(mouseX, mouseY, mouseRadius) {
      // Mouse attraction/repulsion
      const dx = this.x - mouseX;
      const dy = this.y - mouseY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < mouseRadius) {
        const force = (mouseRadius - distance) / mouseRadius;
        const angle = Math.atan2(dy, dx);
        this.vx += Math.cos(angle) * force * 0.02;
        this.vy += Math.sin(angle) * force * 0.02;
      }

      // Update position
      this.x += this.vx;
      this.y += this.vy;

      // Bounce off edges
      if (this.x < 0 || this.x > window.innerWidth) this.vx *= -1;
      if (this.y < 0 || this.y > window.innerHeight) this.vy *= -1;

      // Keep particles in bounds
      this.x = Math.max(0, Math.min(window.innerWidth, this.x));
      this.y = Math.max(0, Math.min(window.innerHeight, this.y));

      // Friction
      this.vx *= 0.99;
      this.vy *= 0.99;
    }

    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    drawConnections(ctx, particles, maxDistance) {
      this.connections = [];

      for (let other of particles) {
        if (other === this) continue;

        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < maxDistance) {
          this.connections.push({ particle: other, distance });

          ctx.save();
          ctx.globalAlpha = (maxDistance - distance) / maxDistance * 0.3;
          ctx.strokeStyle = this.color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(this.x, this.y);
          ctx.lineTo(other.x, other.y);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }

  function initParticles() {
    particles = [];
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Adjust particle count based on screen size
    if (width < 768 || height < 600) {
      particleCount = 20;
    } else if (width < 1200 || height < 900) {
      particleCount = 35;
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle(
        Math.random() * width,
        Math.random() * height
      ));
    }
  }

  function animate() {
    if (!ctx) return;

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    // Update and draw particles
    particles.forEach(particle => {
      particle.update(mouse.x, mouse.y, mouseRadius);
      particle.draw(ctx);
    });

    // Draw connections
    particles.forEach(particle => {
      particle.drawConnections(ctx, particles, connectionDistance);
    });

    animationFrame = requestAnimationFrame(animate);
  }

  function handleMouseMove(event) {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
  }

  function handleResize() {
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    }
  }

  onMount(() => {
    if (typeof window === 'undefined' || !canvas) return;

    ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    initParticles();
    animate();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);
  });

  onDestroy(() => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('resize', handleResize);
  });
</script>

<canvas
  bind:this={canvas}
  class="particle-system"
></canvas>

<style>
  .particle-system {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: -1;
    opacity: 0.6;
  }
</style>