export const triggerParticleBurst = (x, y, rarity) => {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  const particles = [];
  const colors = {
    'Common': ['#88a798', '#e2f0e9', '#ffffff'],
    'Uncommon': ['#00e1ff', '#ffffff', '#8cefff'],
    'Rare': ['#b700ff', '#e085ff', '#ffffff'],
    'Epic': ['#ffaa00', '#ffd073', '#ffffff'],
    'Legendary': ['#ff3366', '#00e1ff', '#ffffff', '#b700ff']
  };
  
  const selectedColors = colors[rarity] || colors['Common'];
  const particleCount = rarity === 'Legendary' ? 150 : rarity === 'Epic' ? 100 : rarity === 'Rare' ? 70 : 40;

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * (Math.random() * 15 + 5),
      vy: (Math.random() - 0.5) * (Math.random() * 15 + 5),
      size: Math.random() * 4 + 1,
      color: selectedColors[Math.floor(Math.random() * selectedColors.length)],
      life: 1,
      decay: Math.random() * 0.02 + 0.015
    });
  }

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let active = false;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.life > 0) {
        active = true;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1; // gravity
        p.life -= p.decay;
        
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        
        // Add glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
      }
    }

    if (active) {
      requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  animate();
};
