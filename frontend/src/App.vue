<script setup>
import { GraduationCap, Upload, Menu, X, ArrowRight, ExternalLink, RefreshCw, Layers, BookOpen, LogOut, User } from 'lucide-vue-next';
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useConfigStore } from './store/config';
import { useAuthStore } from './store/auth';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const router = useRouter();
const config = useConfigStore();
const auth = useAuthStore();
const isMobileMenuOpen = ref(false);

const gridOffsetX = ref(0);
const gridOffsetY = ref(0);
const mouseX = ref(0);
const mouseY = ref(0);

const handleMouseMove = (e) => {
  mouseX.value = e.clientX;
  mouseY.value = e.clientY;
};

const animateGrid = () => {
  gridOffsetX.value = (gridOffsetX.value + 0.3) % 40;
  gridOffsetY.value = (gridOffsetY.value + 0.3) % 40;
  requestAnimationFrame(animateGrid);
};

const navLinks = [
  { name: 'Curriculum', path: '/explorer' },
  { name: 'Syllabus', path: '/syllabus' },
  { name: 'Papers', path: '/question-papers' },
  { name: 'Schedules', path: '/schedules' },
  { name: 'Search', path: '/browse' }
];

const handleLogout = async () => {
  await auth.logout();
  router.push('/');
};

auth.checkSession();

onMounted(() => {
  animateGrid();
  
  const lenis = new Lenis({
    duration: 1.8,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1.2,
    smoothTouch: false,
    touchMultiplier: 2.5,
    infinite: false,
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);

  lenis.on('scroll', ScrollTrigger.update);
  
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
});
</script>

<template>
  <div class="min-h-screen bg-background relative overflow-x-hidden" @mousemove="handleMouseMove">
    <div class="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <div class="absolute inset-0 opacity-[0.03]">
        <svg class="w-full h-full">
          <defs>
            <pattern
              id="global-grid-base"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
              :x="gridOffsetX"
              :y="gridOffsetY"
            >
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" stroke-width="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#global-grid-base)" />
        </svg>
      </div>

      <div 
        class="absolute inset-0 opacity-20"
        :style="{
          maskImage: `radial-gradient(350px circle at ${mouseX}px ${mouseY}px, black, transparent)`,
          WebkitMaskImage: `radial-gradient(350px circle at ${mouseX}px ${mouseY}px, black, transparent)`
        }"
      >
        <svg class="w-full h-full text-white">
          <defs>
            <pattern
              id="global-grid-highlight"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
              :x="gridOffsetX"
              :y="gridOffsetY"
            >
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" stroke-width="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#global-grid-highlight)" />
        </svg>
      </div>

      <div class="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-white/10 rounded-full blur-[120px]"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-mauve/5 rounded-full blur-[120px]"></div>
      <div class="absolute inset-0 scanline-overlay opacity-[0.15]"></div>
      
      <div class="absolute inset-0 opacity-[0.02] font-zendots text-[20vw] flex flex-col leading-[0.8] select-none pointer-events-none p-20">
        <span>RESO</span>
        <span class="self-end">CBIT</span>
      </div>
    </div>

    <nav class="fixed top-8 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl z-50 glass-panel-luxury px-8 py-5 flex items-center gap-6">
      <router-link to="/" class="flex items-center gap-3 group shrink-0">
        <div class="w-8 h-8 bg-white rounded-xl flex items-center justify-center group-hover:neural-glow transition-all">
          <GraduationCap :size="18" class="text-black" />
        </div>
        <span class="text-xl font-zendots tracking-tighter text-white group-hover:text-white transition-colors hidden sm:inline">RESO<span class="text-white group-hover:text-white">.</span></span>
      </router-link>

      <div class="flex-1 hidden md:flex items-center justify-center gap-8 lg:gap-10">
        <router-link v-for="link in navLinks" :key="link.path" :to="link.path" class="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 hover:text-white transition-colors relative group whitespace-nowrap">
          {{ link.name }}
          <span class="absolute -bottom-2 left-0 w-0 h-px bg-white transition-all group-hover:w-full"></span>
        </router-link>
      </div>

      <div class="flex items-center gap-4 shrink-0 ml-auto md:ml-0">
        <router-link to="/upload" class="hidden xl:flex items-center gap-2 text-white/40 hover:text-white transition-colors">
          <Upload :size="16" />
          <span class="text-[9px] font-black uppercase tracking-[0.15em]">Contribute</span>
        </router-link>

        <template v-if="auth.isAuthenticated">
          <div class="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
            <User :size="12" class="text-white" />
            <span class="text-[8px] font-black uppercase tracking-[0.15em] text-white/60">{{ auth.userDept }}</span>
            <span class="text-[8px] text-white/20">•</span>
            <span class="text-[8px] font-bold uppercase tracking-wider text-white/40">{{ auth.userRole }}</span>
          </div>
          <button @click="handleLogout" class="px-5 py-2.5 bg-white/10 text-white/60 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-red-500/20 hover:text-red-400 transition-all flex items-center gap-2">
            <LogOut :size="12" />
            <span class="hidden sm:inline">Logout</span>
          </button>
        </template>
        <router-link v-else to="/login" class="px-6 py-2.5 bg-white text-black rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-white transition-all shadow-lg shadow-white/20">
          Login
        </router-link>
        <button @click="isMobileMenuOpen = !isMobileMenuOpen" class="lg:hidden w-10 h-10 flex items-center justify-center text-white">
          <Menu v-if="!isMobileMenuOpen" :size="24" />
          <X v-else :size="24" />
        </button>
      </div>
    </nav>

    <transition
      enter-active-class="transition duration-500 ease-out"
      enter-from-class="opacity-0 translate-y-[-20px]"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-300 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-[-20px]"
    >
      <div v-if="isMobileMenuOpen" class="fixed inset-0 z-[60] bg-black/95 backdrop-blur-2xl pt-32 px-10">
        <div class="flex flex-col gap-8">
          <router-link 
            v-for="link in navLinks" 
            :key="link.path" 
            :to="link.path"
            @click="isMobileMenuOpen = false"
            class="text-4xl font-heading font-black tracking-tighter text-white hover:text-white transition-colors"
          >
            {{ link.name }}
          </router-link>
          <div class="h-px bg-white/10 w-20 my-4"></div>
          <router-link to="/upload" @click="isMobileMenuOpen = false" class="text-white text-xl font-bold">Contribute Materials</router-link>
        </div>
      </div>
    </transition>

    <main class="relative z-10 pt-32 pb-20">
      <router-view v-slot="{ Component }">
        <transition 
          enter-active-class="transition duration-500 ease-out"
          enter-from-class="opacity-0 translate-y-8"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition duration-300 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 translate-y-[-8px]"
          mode="out-in"
        >
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <footer class="relative z-10 border-t border-white/5 py-24 bg-black/20 backdrop-blur-3xl">
      <div class="max-w-7xl mx-auto px-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
          <div class="md:col-span-1">
            <router-link to="/" class="flex items-center gap-4 mb-8 group">
              <div class="w-8 h-8 bg-white rounded-lg flex items-center justify-center group-hover:neural-glow transition-all">
                <GraduationCap :size="18" class="text-black" />
              </div>
              <span class="text-xl font-zendots tracking-tighter text-white">RESO<span class="text-white">.</span></span>
            </router-link>
            <p class="text-white/30 text-sm leading-relaxed font-light font-label">
              The definitive hub for CBIT students. Decelerating the search, accelerating the learning.
            </p>
          </div>

          <div>
            <h4 class="text-white text-xs font-black uppercase tracking-[0.3em] mb-8">Navigation</h4>
            <ul class="space-y-4">
              <li v-for="link in [
                { name: 'Curriculum', path: '/explorer' },
                { name: 'Question Papers', path: '/question-papers' },
                { name: 'Schedules', path: '/schedules' },
                { name: 'Search Hub', path: '/browse' }
              ]" :key="link.name">
                <router-link :to="link.path" class="text-white/40 hover:text-white text-sm transition-colors">{{ link.name }}</router-link>
              </li>
            </ul>
          </div>

          <div>
            <h4 class="text-white text-xs font-black uppercase tracking-[0.3em] mb-8">Resources</h4>
            <ul class="space-y-4">
              <li v-for="link in [
                { name: 'Contribute Materials', path: '/upload' },
                { name: 'Subject Explorer', path: '/explorer' },
                { name: 'Exam Paper Archive', path: '/question-papers' },
                { name: 'Academic Schedules', path: '/schedules' }
              ]" :key="link.name">
                <router-link :to="link.path" class="text-white/40 hover:text-white text-sm transition-colors">{{ link.name }}</router-link>
              </li>
            </ul>
          </div>

          <div>
            <h4 class="text-white text-xs font-black uppercase tracking-[0.3em] mb-8">CBIT Links</h4>
            <ul class="space-y-4">
              <li v-for="link in [
                { name: 'Main Website', url: 'https://cbit.ac.in' },
                { name: 'Student Portal', url: 'https://cbit.org.in' },
                { name: 'Examination Cell', url: 'https://www.cbit.ac.in/?page_id=141' },
                { name: 'AEC Cell', url: 'https://www.cbit.ac.in/?page_id=158' }
              ]" :key="link.name">
                <a :href="link.url" target="_blank" class="text-white/40 hover:text-white text-sm transition-colors flex items-center gap-2">
                  {{ link.name }}
                  <ExternalLink :size="12" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div class="flex flex-col md:flex-row justify-between items-center pt-10 border-t border-white/5 gap-6">
          <p class="text-[9px] font-mono text-white/20 uppercase tracking-[0.2em]">© 2026 RESO HUB • Built for CBIT</p>
          <div class="flex gap-8">
             <a href="#" class="text-[9px] font-mono text-white/20 uppercase tracking-[0.2em] hover:text-white">About RESO</a>
             <a href="https://github.com/ifrahanjum/reso/issues" target="_blank" class="text-[9px] font-mono text-white/20 uppercase tracking-[0.2em] hover:text-white">Report Issue</a>
          </div>
        </div>
      </div>
    </footer>

    <div class="custom-cursor hidden lg:block"></div>
  </div>
</template>

<style>
.router-link-active {
  color: #ffffff !important;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.4);
}

.custom-cursor {
  width: 20px;
  height: 20px;
  background: rgba(255, 255, 255, 0.3);
  border: 1px solid #ffffff;
  border-radius: 50%;
  position: fixed;
  pointer-events: none;
  z-index: 9999;
  mix-blend-mode: screen;
  transition: transform 0.1s ease-out;
  transform: translate(-50%, -50%);
}

html.lenis {
  height: auto;
}

.lenis.lenis-smooth {
  scroll-behavior: auto;
}

.lenis.lenis-smooth [data-lenis-prevent] {
  overscroll-behavior: contain;
}

.lenis.lenis-stopped {
  overflow: hidden;
}

.lenis.lenis-scrolling iframe {
  pointer-events: none;
}
</style>