<script setup>
import { 
  Calendar, Download, ExternalLink, Clock, FileText, Search, Filter,
  ChevronDown, Eye, RefreshCw, Sparkles, ArrowRight, Upload
} from 'lucide-vue-next';
import { ref, computed } from 'vue';
import SearchBar from '../components/SearchBar.vue';
import Dropdown from '../components/Dropdown.vue';
import TiltCard from '../components/TiltCard.vue';
import { useConfigStore } from '../store/config';
import { useAuthStore } from '../store/auth';
import { useRouter } from 'vue-router';

import { useResourceStore } from '../store/resources';
import { onMounted } from 'vue';

const config = useConfigStore();
const auth = useAuthStore();
const router = useRouter();
const resourceStore = useResourceStore();

const handleUploadClick = () => {
  if (auth.isAuthenticated) {
    router.push('/upload');
  } else {
    router.push('/login');
  }
};

const searchQuery = ref('');
const getCategoryFromDept = (dept) => {
  if (['CIV', 'MEC', 'EEE', 'ECE', 'CSE', 'AIML', 'AIDS', 'CET', 'BIO', 'CHEM', 'IT'].includes(dept)) return 'B.E / B.Tech';
  return 'All Categories';
};

const selectedCategory = ref(config.dept ? getCategoryFromDept(config.dept) : 'All Categories');

async function loadSchedules() {
  await resourceStore.fetchResources({
    resource_type: 'calendar',
    per_page: 50
  });
}

onMounted(loadSchedules);

const filteredCalendars = computed(() => {
  let base = resourceStore.allResources.filter(r => r.resource_type === 'calendar');
  
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    base = base.filter(c => c.title.toLowerCase().includes(q));
  }

  if (selectedCategory.value !== 'All Categories') {
  }

  return base;
});

const categories = ['All Categories', 'B.E / B.Tech', 'M.E / M.Tech', 'MBA', 'MCA'];
</script>

<template>
  <div class="max-w-7xl mx-auto px-6 py-12">
    <div class="mb-20">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-12">
        <div class="flex items-center gap-6">
          <div class="w-16 h-16 bg-white/5 border border-white/10 text-white rounded-3xl flex items-center justify-center neural-glow">
            <Calendar :size="32" />
          </div>
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-[8px] font-mono uppercase tracking-[0.2em] mb-3">
              Academic Calendar
            </div>
            <h1 class="text-t1 text-white">Academic Schedules<span class="text-white">.</span></h1>
          </div>
        </div>
        
        <div class="flex gap-12">
           <div class="text-left">
             <p class="text-[9px] font-mono font-black uppercase tracking-[0.3em] text-white/20 mb-2">Updated</p>
             <p class="font-heading font-black text-lg text-white">26 APR 2026</p>
           </div>
           <div class="text-left">
             <p class="text-[9px] font-mono font-black uppercase tracking-[0.3em] text-white/20 mb-2">Next Event</p>
             <p class="font-heading font-black text-lg text-white">12 MAY 2026</p>
           </div>
        </div>
      </div>
    </div>

    <div class="flex flex-col md:flex-row items-center gap-6 mb-20">
      <div class="flex-1 w-full">
        <SearchBar 
          v-model="searchQuery"
          placeholder="Search schedules..."
          expand-width="100%"
        />
      </div>
      
      <div class="min-w-[280px] w-full md:w-auto">
        <Dropdown 
          v-model="selectedCategory"
          :options="categories"
          placeholder="Filter Category"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-16">
      <div class="lg:col-span-2 space-y-8">
        <TiltCard v-for="cal in filteredCalendars" :key="cal.id" class="card group border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between p-10 gap-10">
          <div class="flex items-center gap-8">
            <div class="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white/20 group-hover:bg-white group-hover:text-black group-hover:neural-glow transition-all shrink-0">
              <FileText :size="32" />
            </div>
            <div>
              <div class="flex items-center gap-3 mb-2">
                <span class="px-3 py-1 bg-white/10 text-white text-[9px] font-black uppercase tracking-widest rounded-lg border border-white/20">{{ cal.resource_type.replace('_', ' ') }}</span>
              </div>
              <h3 class="text-2xl font-heading font-black text-white leading-tight mb-2">{{ cal.title }}</h3>
              <p class="text-[10px] font-mono font-bold text-white/20 uppercase tracking-widest">
                Published {{ new Date(cal.created_at).toLocaleDateString() }}
                <template v-if="cal.dept"> • {{ cal.dept }}</template>
              </p>
            </div>
          </div>
          <div class="flex gap-4 w-full sm:w-auto">
            <router-link :to="`/reader/${cal.id}`" class="flex-1 sm:flex-none btn-secondary flex items-center justify-center gap-3 group/btn">
               <Eye :size="18" class="text-white group-hover/btn:scale-110 transition-transform" />
               View
            </router-link>
            <a :href="cal.file_url" target="_blank" class="flex-1 sm:flex-none btn-primary flex items-center justify-center gap-3">
              <Download :size="18" />
              PDF
            </a>
          </div>
        </TiltCard>
      </div>

      <div class="lg:col-span-1 space-y-12">
        <div v-if="config.isSynced" class="p-10 bg-white/5 border border-white/10 rounded-[2.5rem] relative overflow-hidden group">
           <div class="absolute -right-4 -top-4 text-white opacity-5 group-hover:opacity-10 transition-opacity">
              <RefreshCw :size="120" class="animate-[spin_10s_linear_infinite]" />
           </div>
           <div class="flex items-center gap-4">
             <RefreshCw :size="20" />
             <h4 class="text-[10px] font-mono font-black uppercase tracking-[0.3em]">Quick Links</h4>
           </div>
           <p class="text-white/40 text-sm leading-relaxed mb-10 font-label font-light">
             Your current view is synced to {{ config.dept }} Semester {{ config.sem }}.
           </p>
           <router-link to="/" class="text-white text-[9px] font-black uppercase tracking-[0.4em] hover:tracking-[0.5em] transition-all flex items-center gap-2">
             Change Settings <ArrowRight :size="14" />
           </router-link>
        </div>
        
        <div @click="handleUploadClick" class="p-10 bg-white text-black rounded-[2.5rem] cursor-pointer group hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-white/10">
           <div class="flex items-center justify-between mb-8">
              <div class="w-12 h-12 bg-black/5 rounded-2xl flex items-center justify-center">
                 <Upload :size="20" />
              </div>
              <ArrowRight :size="20" class="-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
           </div>
           <h4 class="text-xl font-heading font-black mb-2">Contribute Schedule</h4>
           <p class="text-black/60 text-xs font-label leading-relaxed">Help others by uploading the latest academic calendar or exam schedule.</p>
        </div>

        <div class="card bg-white/[0.02] border border-white/5 p-10">
          <div class="flex items-center gap-4 mb-10">
            <div class="w-12 h-12 bg-white/5 text-white rounded-xl flex items-center justify-center">
              <Clock :size="24" />
            </div>
            <h4 class="text-[10px] font-mono font-black uppercase tracking-[0.4em] text-white">Upcoming Events</h4>
          </div>
          <div class="space-y-10">
            <div v-for="i in 3" :key="i" class="flex gap-6 group cursor-pointer">
              <div class="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl shrink-0 flex flex-col items-center justify-center group-hover:border-white/50 transition-colors">
                <span class="text-[9px] font-mono font-black text-white mb-1">MAY</span>
                <span class="text-lg font-heading font-black text-white leading-none">{{ 10 + i * 2 }}</span>
              </div>
              <div class="flex flex-col justify-center">
                <p class="font-heading font-black text-white text-base group-hover:text-white transition-colors leading-tight mb-1">MID-2 Examinations</p>
                <p class="text-[10px] font-mono font-bold text-white/20 uppercase tracking-widest">{{ config.dept || 'Engineering' }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="card bg-white text-black p-10 relative overflow-hidden group">
          <div class="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <Calendar :size="200" />
          </div>
          <h4 class="text-xl font-heading font-black mb-4 relative z-10">Official Records</h4>
          <p class="text-black/70 mb-10 text-sm leading-relaxed font-label font-medium relative z-10">
            All chronologies are sourced directly from the CBIT academic cell. Verified for the current academic session.
          </p>
          <a href="https://www.cbit.ac.in/current_students/acedamic-calendar/" target="_blank" class="flex items-center justify-between p-5 bg-black/10 rounded-2xl hover:bg-black/20 transition-all border border-black/5 relative z-10">
            <span class="font-mono text-[10px] font-black uppercase tracking-[0.2em]">Open Official Calendar</span>
            <ExternalLink :size="18" />
          </a>
        </div>
      </div>
    </div>
  </div>
</template>