<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import gsap from 'gsap';

const props = defineProps({
  tiltLimit: { type: Number, default: 15 },
  scale: { type: Number, default: 1.05 },
  perspective: { type: Number, default: 1200 },
  effect: { type: String, default: 'evade' }, 
  spotlight: { type: Boolean, default: true }
});

const cardRef = ref(null);
const spotlightPos = ref({ x: 50, y: 50 });
const isHovered = ref(false);

const dir = props.effect === 'evade' ? -1 : 1;

const handleMouseMove = (e) => {
  const el = cardRef.current || cardRef.value;
  if (!el) return;
  
  const rect = el.getBoundingClientRect();
  const px = (e.clientX - rect.left) / rect.width;
  const py = (e.clientY - rect.top) / rect.height;
  
  const xRot = (py - 0.5) * (props.tiltLimit * 2) * dir;
  const yRot = (px - 0.5) * -(props.tiltLimit * 2) * dir;
  
  gsap.to(el, {
    rotateX: xRot,
    rotateY: yRot,
    scale: props.scale,
    perspective: props.perspective,
    duration: 0.3,
    ease: "power2.out"
  });

  if (props.spotlight) {
    spotlightPos.value = { x: px * 100, y: py * 100 };
  }
};

const handleMouseEnter = () => {
  isHovered.value = true;
};

const handleMouseLeave = () => {
  const el = cardRef.current || cardRef.value;
  if (!el) return;
  
  isHovered.value = false;
  gsap.to(el, {
    rotateX: 0,
    rotateY: 0,
    scale: 1,
    duration: 0.5,
    ease: "elastic.out(1, 0.3)"
  });
};
</script>

<template>
  <div
    ref="cardRef"
    @mouseenter="handleMouseEnter"
    @mousemove="handleMouseMove"
    @mouseleave="handleMouseLeave"
    class="relative overflow-hidden will-change-transform"
    style="transform-style: preserve-3d;"
  >
    <slot />
    
    <div
      v-if="spotlight"
      class="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
      :style="{ opacity: isHovered ? 1 : 0 }"
    >
      <div
        class="absolute w-[200%] h-[200%] rounded-full"
        :style="{
          left: `${spotlightPos.x}%`,
          top: `${spotlightPos.y}%`,
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 40%)'
        }"
      />
    </div>
  </div>
</template>

<style scoped>
.will-change-transform {
  will-change: transform;
}
</style>
