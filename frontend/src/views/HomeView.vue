<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { User, Mail, Lock, ArrowRight, GraduationCap, Briefcase, Info, Loader2, AlertCircle, CheckCircle } from 'lucide-vue-next';
import { useAuthStore } from '../store/auth';
import gsap from 'gsap';
import DotGrid from '../components/DotGrid.vue';

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const loginType = ref('student');

const studentForm = ref({
  rollNo: '',
  section: ''
});

const facultyForm = ref({
  email: '',
  dept: ''
});

const showSuccess = ref(false);

const containerRef = ref(null);
const formRef = ref(null);
const headerRef = ref(null);

onMounted(() => {
  if (auth.isAuthenticated) {
    router.push(route.query.redirect || '/');
    return;
  }

  const tl = gsap.timeline({ defaults: { ease: 'power4.out', duration: 1.2 } });
  
  tl.from(headerRef.value, { 
    y: 40, 
    opacity: 0, 
    stagger: 0.1 
  })
  .from(formRef.value, { 
    scale: 0.95, 
    opacity: 0,
    y: 20
  }, "-=0.8");
});

const toggleLoginType = (type) => {
  if (loginType.value === type) return;
  auth.error = ''; 
  
  gsap.to(formRef.value, {
    opacity: 0,
    x: type === 'student' ? 20 : -20,
    duration: 0.3,
    ease: 'power2.in',
    onComplete: () => {
      loginType.value = type;
      gsap.fromTo(formRef.value, 
        { opacity: 0, x: type === 'student' ? -20 : 20 },
        { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out' }
      );
    }
  });
};

const handleStudentLogin = async () => {
  auth.error = '';
  const success = await auth.login('student', studentForm.value.rollNo, studentForm.value.section);
  
  if (success) {
    showSuccess.value = true;
    setTimeout(() => {
      router.push(route.query.redirect || '/');
    }, 800);
  }
};

const handleFacultyLogin = async () => {
  auth.error = '';
  const success = await auth.login('faculty', facultyForm.value.email, facultyForm.value.dept);
  
  if (success) {
    showSuccess.value = true;
    setTimeout(() => {
      router.push(route.query.redirect || '/');
    }, 800);
  }
};
</script>

<template>
  <div class="min-h-screen relative flex flex-col font-sans selection:bg-white selection:text-black overflow-hidden bg-[#050505]">
    <DotGrid 
      :dotSize="3" 
      :gap="17" 
      baseColor="#222222" 
      activeColor="#ffffff" 
      :proximity="120" 
      :shockRadius="250" 
      :shockStrength="20" 
      :resistance="600" 
      :returnDuration="1.2"
      class="fixed inset-0 z-0"
    />

    <header class="fixed top-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-full flex items-center gap-8 shadow-2xl">
      <div class="flex items-center gap-2">
        <div class="w-2 h-2 rounded-full bg-white"></div>
        <span class="text-[10px] font-black tracking-[0.2em] uppercase">System.Online</span>
      </div>
      <nav class="flex items-center gap-6">
        <a href="/" class="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors">Home</a>
        <a href="#" class="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors">Support</a>
      </nav>
      <div class="h-4 w-px bg-white/10"></div>
      <span class="text-[10px] font-bold uppercase tracking-widest text-white/60">v1.4.2</span>
    </header>

    <main class="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pt-20">
      <div ref="containerRef" class="w-full max-w-[440px] space-y-10">
        
        <div ref="headerRef" class="text-center space-y-4">
          <div class="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-4">
            <span class="w-1 h-1 rounded-full bg-white"></span>
            <span class="text-[9px] font-black uppercase tracking-[0.2em] text-white/60">Secure Authentication Protocol</span>
          </div>
          <h1 class="text-6xl md:text-7xl font-black tracking-tighter leading-[0.9] text-white">
            PORTAL<br/>
            <span class="text-white/20">ACCESS</span>
          </h1>
          <p class="text-white/40 text-sm font-medium max-w-[280px] mx-auto leading-relaxed">
            Exclusively for authenticated CBIT students and faculty members.
          </p>
        </div>

        <div class="p-1.5 bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-full flex relative overflow-hidden">
          <button 
            @click="toggleLoginType('student')"
            class="flex-1 py-3 px-6 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-500 z-10 flex items-center justify-center gap-2"
            :class="loginType === 'student' ? 'text-black' : 'text-white/40 hover:text-white'"
          >
            <GraduationCap :size="14" />
            Student
          </button>
          <button 
            @click="toggleLoginType('faculty')"
            class="flex-1 py-3 px-6 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-500 z-10 flex items-center justify-center gap-2"
            :class="loginType === 'faculty' ? 'text-black' : 'text-white/40 hover:text-white'"
          >
            <Briefcase :size="14" />
            Faculty
          </button>
          <div 
            class="absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-3px)] bg-white rounded-full transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
            :style="{ transform: loginType === 'student' ? 'translateX(0)' : 'translateX(100%)' }"
          ></div>
        </div>

        <div ref="formRef" class="space-y-6">
          <Transition name="fade">
            <div v-if="auth.error" class="flex items-center gap-3 px-5 py-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
              <AlertCircle :size="16" class="text-red-400 shrink-0" />
              <p class="text-red-400 text-xs font-bold tracking-wide">{{ auth.error }}</p>
            </div>
          </Transition>

          <Transition name="fade">
            <div v-if="showSuccess" class="flex items-center gap-3 px-5 py-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
              <CheckCircle :size="16" class="text-emerald-400 shrink-0" />
              <p class="text-emerald-400 text-xs font-bold tracking-wide">Authenticated successfully. Redirecting...</p>
            </div>
          </Transition>

          <Transition name="fade" mode="out-in">
            <form v-if="loginType === 'student'" @submit.prevent="handleStudentLogin" class="space-y-4">
              <div class="space-y-2">
                <div class="relative group">
                  <User class="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors" :size="18" />
                  <input 
                    v-model="studentForm.rollNo"
                    type="text" 
                    placeholder="ROLL NUMBER (e.g. 160123733001)" 
                    maxlength="12"
                    class="w-full bg-white/[0.02] border border-white/10 rounded-full py-5 pl-16 pr-8 text-sm focus:outline-none focus:border-white/40 focus:bg-white/[0.05] transition-all placeholder:text-white/10 placeholder:font-bold placeholder:tracking-widest placeholder:text-[10px]"
                    :disabled="auth.isLoading"
                  />
                </div>
                <div class="relative group">
                  <Lock class="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors" :size="18" />
                  <input 
                    v-model="studentForm.section"
                    type="password" 
                    placeholder="DEPARTMENT NAME AS PASSWORD" 
                    class="w-full bg-white/[0.02] border border-white/10 rounded-full py-5 pl-16 pr-8 text-sm focus:outline-none focus:border-white/40 focus:bg-white/[0.05] transition-all placeholder:text-white/10 placeholder:font-bold placeholder:tracking-widest placeholder:text-[10px]"
                    :disabled="auth.isLoading"
                  />
                </div>
              </div>
              
              <button 
                type="submit"
                :disabled="auth.isLoading || !studentForm.rollNo || !studentForm.section"
                class="w-full bg-white text-black font-black py-5 rounded-full flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <Loader2 v-if="auth.isLoading" :size="18" class="animate-spin" />
                <template v-else>
                  AUTHENTICATE
                  <ArrowRight :size="18" />
                </template>
              </button>
            </form>

            <form v-else @submit.prevent="handleFacultyLogin" class="space-y-4">
              <div class="space-y-2">
                <div class="relative group">
                  <Mail class="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors" :size="18" />
                  <input 
                    v-model="facultyForm.email"
                    type="email" 
                    placeholder="OFFICIAL EMAIL (@CBIT.AC.IN)" 
                    class="w-full bg-white/[0.02] border border-white/10 rounded-full py-5 pl-16 pr-8 text-sm focus:outline-none focus:border-white/40 focus:bg-white/[0.05] transition-all placeholder:text-white/10 placeholder:font-bold placeholder:tracking-widest placeholder:text-[10px]"
                    :disabled="auth.isLoading"
                  />
                </div>
                <div class="relative group">
                  <Lock class="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors" :size="18" />
                  <input 
                    v-model="facultyForm.dept"
                    type="password" 
                    placeholder="DEPARTMENT CODE AS PASSWORD" 
                    class="w-full bg-white/[0.02] border border-white/10 rounded-full py-5 pl-16 pr-8 text-sm focus:outline-none focus:border-white/40 focus:bg-white/[0.05] transition-all placeholder:text-white/10 placeholder:font-bold placeholder:tracking-widest placeholder:text-[10px]"
                    :disabled="auth.isLoading"
                  />
                </div>
              </div>

              <button 
                type="submit"
                :disabled="auth.isLoading || !facultyForm.email || !facultyForm.dept"
                class="w-full bg-white text-black font-black py-5 rounded-full flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <Loader2 v-if="auth.isLoading" :size="18" class="animate-spin" />
                <template v-else>
                  FACULTY LOGIN
                  <ArrowRight :size="18" />
                </template>
              </button>
            </form>
          </Transition>

          <div class="pt-6 flex flex-col items-center gap-4">
            <p class="text-[10px] text-white/20 font-bold tracking-widest uppercase flex items-center gap-2">
              <Info :size="12" />
              Password is your department code (e.g. cse, ece, it)
            </p>
            <div class="flex items-center gap-6 opacity-30 grayscale hover:grayscale-0 hover:opacity-60 transition-all cursor-default">
              <span class="text-[10px] font-black uppercase tracking-widest">CBIT</span>
              <span class="text-[10px] font-black uppercase tracking-widest">AEC</span>
              <span class="text-[10px] font-black uppercase tracking-widest">CDC</span>
            </div>
          </div>
        </div>
      </div>
    </main>

    <footer class="p-8 flex justify-between items-end relative z-10">
      <div class="space-y-1">
        <p class="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">Data Security</p>
        <p class="text-[10px] font-bold text-white/40">AES-256 Bit Encrypted</p>
      </div>
      <div class="text-right space-y-1">
        <p class="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">Authorized Access</p>
        <p class="text-[10px] font-bold text-white/40">Monitoring Active</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
}

::-webkit-scrollbar {
  width: 4px;
}
::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}
</style>