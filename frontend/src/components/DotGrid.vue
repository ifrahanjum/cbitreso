<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';
import { gsap } from 'gsap';
import { InertiaPlugin } from 'gsap/InertiaPlugin';

gsap.registerPlugin(InertiaPlugin);

const props = defineProps({
  dotSize: { type: Number, default: 16 },
  gap: { type: Number, default: 32 },
  baseColor: { type: String, default: '#5227FF' },
  activeColor: { type: String, default: '#5227FF' },
  proximity: { type: Number, default: 150 },
  speedTrigger: { type: Number, default: 100 },
  shockRadius: { type: Number, default: 250 },
  shockStrength: { type: Number, default: 5 },
  maxSpeed: { type: Number, default: 5000 },
  resistance: { type: Number, default: 750 },
  returnDuration: { type: Number, default: 1.5 },
  className: { type: String, default: '' },
  style: { type: Object, default: () => ({}) }
});

const wrapperRef = ref(null);
const canvasRef = ref(null);
const pointerRef = ref({ x: 0, y: 0, vx: 0, vy: 0, speed: 0, lastTime: 0, lastX: 0, lastY: 0 });

let dots = [];

const throttle = (func, limit) => {
  let lastCall = 0;
  return function (...args) {
    const now = performance.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      func.apply(this, args);
    }
  };
};

function hexToRgb(hex) {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return { r: 0, g: 0, b: 0 };
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

const baseRgb = computed(() => hexToRgb(props.baseColor));
const activeRgb = computed(() => hexToRgb(props.activeColor));

const circlePath = computed(() => {
  if (typeof window === 'undefined' || !window.Path2D) return null;
  const p = new window.Path2D();
  p.arc(0, 0, props.dotSize / 2, 0, Math.PI * 2);
  return p;
});

const buildGrid = () => {
  const wrap = wrapperRef.value;
  const canvas = canvasRef.value;
  if (!wrap || !canvas) return;

  const { width: rectWidth, height: rectHeight } = wrap.getBoundingClientRect();
  const width = rectWidth || window.innerWidth;
  const height = rectHeight || window.innerHeight;
  
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext('2d');
  if (ctx) ctx.scale(dpr, dpr);

  const cols = Math.floor((width + props.gap) / (props.dotSize + props.gap));
  const rows = Math.floor((height + props.gap) / (props.dotSize + props.gap));
  const cell = props.dotSize + props.gap;

  const gridW = cell * cols - props.gap;
  const gridH = cell * rows - props.gap;
  const extraX = width - gridW;
  const extraY = height - gridH;
  const startX = extraX / 2 + props.dotSize / 2;
  const startY = extraY / 2 + props.dotSize / 2;

  const newDots = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cx = startX + x * cell;
      const cy = startY + y * cell;
      newDots.push({ cx, cy, xOffset: 0, yOffset: 0, _inertiaApplied: false });
    }
  }
  dots = newDots;
  console.log(`DotGrid: Built grid with ${dots.length} dots (${cols}x${rows})`);
};

let rafId;
const draw = () => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const { x: px, y: py } = pointerRef.value;
  const proxSq = props.proximity * props.proximity;

  for (let i = 0; i < dots.length; i++) {
    const dot = dots[i];
    const ox = dot.cx + dot.xOffset;
    const oy = dot.cy + dot.yOffset;
    const dx = dot.cx - px;
    const dy = dot.cy - py;
    const dsq = dx * dx + dy * dy;

    let fillStyle = props.baseColor;
    if (dsq <= proxSq) {
      const dist = Math.sqrt(dsq);
      const t = 1 - dist / props.proximity;
      const r = Math.round(baseRgb.value.r + (activeRgb.value.r - baseRgb.value.r) * t);
      const g = Math.round(baseRgb.value.g + (activeRgb.value.g - baseRgb.value.g) * t);
      const b = Math.round(baseRgb.value.b + (activeRgb.value.b - baseRgb.value.b) * t);
      fillStyle = `rgb(${r},${g},${b})`;
    }

    ctx.save();
    ctx.translate(ox, oy);
    ctx.fillStyle = fillStyle;
    if (circlePath.value) ctx.fill(circlePath.value);
    ctx.restore();
  }
  rafId = requestAnimationFrame(draw);
};

const onMove = (e) => {
  const now = performance.now();
  const pr = pointerRef.value;
  const dt = pr.lastTime ? now - pr.lastTime : 16;
  const dx = e.clientX - pr.lastX;
  const dy = e.clientY - pr.lastY;

  let vx = (dx / dt) * 1000;
  let vy = (dy / dt) * 1000;
  let speed = Math.hypot(vx, vy);

  if (speed > props.maxSpeed) {
    const scale = props.maxSpeed / speed;
    vx *= scale;
    vy *= scale;
    speed = props.maxSpeed;
  }

  pr.lastTime = now;
  pr.lastX = e.clientX;
  pr.lastY = e.clientY;
  pr.vx = vx;
  pr.vy = vy;
  pr.speed = speed;

  if (canvasRef.value) {
    const rect = canvasRef.value.getBoundingClientRect();
    pr.x = e.clientX - rect.left;
    pr.y = e.clientY - rect.top;
  }

  if (dots && dots.length > 0) {
    for (let i = 0; i < dots.length; i++) {
      const dot = dots[i];
      const dist = Math.hypot(dot.cx - pr.x, dot.cy - pr.y);
      if (speed > props.speedTrigger && dist < props.proximity && !dot._inertiaApplied) {
        dot._inertiaApplied = true;
        gsap.killTweensOf(dot);
        const pushX = dot.cx - pr.x + vx * 0.005;
        const pushY = dot.cy - pr.y + vy * 0.005;

        if (gsap.plugins && gsap.plugins.inertia) {
          gsap.to(dot, {
            inertia: { xOffset: pushX, yOffset: pushY, resistance: props.resistance },
            onComplete: () => {
              gsap.to(dot, { xOffset: 0, yOffset: 0, duration: props.returnDuration, ease: 'elastic.out(1,0.75)' });
              dot._inertiaApplied = false;
            }
          });
        } else {
          gsap.to(dot, {
            xOffset: pushX,
            yOffset: pushY,
            duration: 0.5,
            ease: 'power2.out',
            onComplete: () => {
              gsap.to(dot, { xOffset: 0, yOffset: 0, duration: props.returnDuration, ease: 'elastic.out(1,0.75)' });
              dot._inertiaApplied = false;
            }
          });
        }
      }
    }
  }
};

const onClick = (e) => {
  if (!canvasRef.value) return;
  const rect = canvasRef.value.getBoundingClientRect();
  const cx = e.clientX - rect.left;
  const cy = e.clientY - rect.top;

  if (dots && dots.length > 0) {
    for (let i = 0; i < dots.length; i++) {
      const dot = dots[i];
      const dist = Math.hypot(dot.cx - cx, dot.cy - cy);
      if (dist < props.shockRadius && !dot._inertiaApplied) {
        dot._inertiaApplied = true;
        gsap.killTweensOf(dot);
        const falloff = Math.max(0, 1 - dist / props.shockRadius);
        const pushX = (dot.cx - cx) * props.shockStrength * falloff;
        const pushY = (dot.cy - cy) * props.shockStrength * falloff;

        if (gsap.plugins && gsap.plugins.inertia) {
          gsap.to(dot, {
            inertia: { xOffset: pushX, yOffset: pushY, resistance: props.resistance },
            onComplete: () => {
              gsap.to(dot, { xOffset: 0, yOffset: 0, duration: props.returnDuration, ease: 'elastic.out(1,0.75)' });
              dot._inertiaApplied = false;
            }
          });
        } else {
          gsap.to(dot, {
            xOffset: pushX,
            yOffset: pushY,
            duration: 0.4,
            ease: 'power2.out',
            onComplete: () => {
              gsap.to(dot, { xOffset: 0, yOffset: 0, duration: props.returnDuration, ease: 'elastic.out(1,0.75)' });
              dot._inertiaApplied = false;
            }
          });
        }
      }
    }
  }
};

const throttledMove = throttle(onMove, 50);

let ro = null;

onMounted(async () => {
  console.log('DotGrid: Component mounting...');
  
  try {
    await nextTick();
    
    buildGrid();
    
    if (typeof window !== 'undefined' && 'ResizeObserver' in window) {
      ro = new ResizeObserver(() => {
        console.log('DotGrid: Resize observed');
        buildGrid();
      });
      if (wrapperRef.value) ro.observe(wrapperRef.value);
    } else {
      window.addEventListener('resize', buildGrid);
    }

    window.addEventListener('mousemove', throttledMove, { passive: true });
    window.addEventListener('click', onClick);

    draw();
    console.log('DotGrid: Component mounted and draw loop started');
  } catch (err) {
    console.error('DotGrid Error during mount:', err);
  }
});

onUnmounted(() => {
  console.log('DotGrid: Component unmounting...');
  if (ro) ro.disconnect();
  else window.removeEventListener('resize', buildGrid);
  window.removeEventListener('mousemove', throttledMove);
  window.removeEventListener('click', onClick);
  cancelAnimationFrame(rafId);
});

watch([() => props.dotSize, () => props.gap], () => {
  buildGrid();
});
</script>

<template>
  <section :class="['dot-grid', className]" :style="style">
    <div ref="wrapperRef" class="dot-grid__wrap">
      <canvas ref="canvasRef" class="dot-grid__canvas" />
    </div>
  </section>
</template>

<style scoped>
.dot-grid {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  position: relative;
}
.dot-grid__wrap {
  width: 100%;
  height: 100%;
  position: relative;
}
.dot-grid__canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
