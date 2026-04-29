<script setup>
import { 
  Search, Filter, Download, GraduationCap, Calendar, History, FileText, 
  ArrowUpDown, Clock, ThumbsUp, Eye, ChevronRight, RefreshCw, Sparkles, Bookmark, Loader2, Trash2
} from 'lucide-vue-next';
import { ref, computed, watch, onMounted } from 'vue';
import SearchBar from '../components/SearchBar.vue';
import Dropdown from '../components/Dropdown.vue';
import TiltCard from '../components/TiltCard.vue';
import { useConfigStore } from '../store/config';
import { useResourceStore } from '../store/resources';
import { useAuthStore } from '../store/auth';

const config = useConfigStore();
const resourceStore = useResourceStore();
const authStore = useAuthStore();
const searchQuery = ref('');
const activeSort = ref('newest');
const isSyncing = ref(false);

const syncForm = ref({
  dept: config.dept || 'CSE',
  sem: config.sem || 1
});

const selectedExamTypes = ref(['MID-1', 'MID-2', 'SEMESTER_END']);
const selectedRegulations = ref(['R22', 'R20', 'R18']);

watch(() => [config.dept, config.sem], ([newDept, newSem]) => {
  if (newDept) syncForm.value.dept = newDept;
  if (newSem) syncForm.value.sem = newSem;
  loadPapers();
});

async function loadPapers() {
  await resourceStore.fetchResources({
    department: syncForm.value.dept,
    semester: syncForm.value.sem,
    resource_type: 'question_paper',
    per_page: 50,
    sort: 'created_at',
    order: 'desc'
  });
}

const filteredPapers = computed(() => {
  let base = resourceStore.allResources;
  
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    base = base.filter(r => r.title.toLowerCase().includes(q));
  }

  base = base.filter(r => {
    if (!r.exam_type) return true;
    return selectedExamTypes.value.includes(r.exam_type);
  });

  base = base.filter(r => {
    if (!r.regulation) return true;
    return selectedRegulations.value.includes(r.regulation);
  });

  return [...base].sort((a, b) => {
    const aSaved = config.isSaved(a.id);
    const bSaved = config.isSaved(b.id);
    if (aSaved && !bSaved) return -1;
    if (!aSaved && bSaved) return 1;
    return 0;
  });
});

const handleSync = async () => {
  isSyncing.value = true;
  config.sync(syncForm.value.dept, syncForm.value.sem);
  await loadPapers();
  isSyncing.value = false;
};

const handleDeleteResource = async (id) => {
  if (!confirm('Are you sure you want to delete this resource? This action cannot be undone.')) return;
  try {
    await resourceStore.deleteResource(id, authStore.token);
    await loadPapers();
  } catch (err) {
    alert(err.message || 'Failed to delete resource');
  }
};

onMounted(loadPapers);

const sortOptions = [
  { label: 'Newest First', value: 'newest', icon: Clock },
  { label: 'Most Popular', value: 'popular', icon: ThumbsUp },
  { label: 'Year (High-Low)', value: 'year-desc', icon: Calendar },
];
</script>

<template>
  <div class="max-w-7xl mx-auto px-6 py-12">
    <div class="flex flex-col lg:flex-row gap-16">
      <aside class="w-full lg:w-80 shrink-0">
        <div class="sticky top-40 space-y-12">
          <div class="p-8 bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-3xl">
            <div class="flex items-center gap-3 mb-8 text-white">
              <RefreshCw :size="20" :class="{ 'animate-spin': isSyncing }" />
              <h4 class="text-[10px] font-mono font-black uppercase tracking-[0.3em]">Quick Settings</h4>
            </div>
            <div class="space-y-4">
              <div class="relative">
                <select v-model="syncForm.dept" class="w-full !py-3.5">
                  <option v-for="d in ['CIV', 'MEC', 'EEE', 'ECE', 'CSE', 'AIML', 'AIDS', 'CET', 'BIO', 'CHEM', 'IT']" :key="d" :value="d">{{ d }}</option>
                </select>
              </div>
              <div class="relative">
                <select v-model="syncForm.sem" class="w-full !py-3.5">
                  <option v-for="i in 8" :key="i" :value="i">Semester {{ i }}</option>
                </select>
              </div>
              <button 
                @click="handleSync"
                class="w-full py-4 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all active:scale-95 shadow-lg shadow-white/20"
              >
                {{ isSyncing ? 'Updating...' : 'Save Preferences' }}
              </button>
            </div>
          </div>

          <div>
            <div class="flex items-center gap-3 mb-10 text-white/40">
              <Filter :size="18" />
              <h2 class="text-[10px] font-mono font-black uppercase tracking-[0.4em]">Filters</h2>
            </div>

            <div class="mb-12">
              <h4 class="text-[9px] font-mono font-black uppercase tracking-[0.2em] text-white/60 mb-6 px-1">Papers</h4>
              <div class="space-y-4">
                <label v-for="type in [{id: 'MID-1', label: 'MID-1'}, {id: 'MID-2', label: 'MID-2'}, {id: 'SEMESTER_END', label: 'SEMESTER END'}]" :key="type.id" class="flex items-center gap-4 cursor-pointer group">
                  <div class="relative flex items-center justify-center w-5 h-5">
                    <input type="checkbox" :value="type.id" v-model="selectedExamTypes" class="peer sr-only" />
                    <div class="w-5 h-5 bg-white/5 border border-white/10 rounded transition-all peer-checked:bg-white peer-checked:border-white"></div>
                    <div class="absolute w-2 h-2 bg-black rounded-[1px] opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                  </div>
                  <span class="text-xs font-label font-medium text-white/40 group-hover:text-white transition-colors uppercase tracking-widest">{{ type.label }}</span>
                </label>
              </div>
            </div>

            <div>
              <h4 class="text-[9px] font-mono font-black uppercase tracking-[0.2em] text-white/60 mb-6 px-1">Regulation</h4>
              <div class="space-y-4">
                <label v-for="reg in ['R22', 'R20', 'R18']" :key="reg" class="flex items-center gap-4 cursor-pointer group">
                  <div class="relative flex items-center justify-center w-5 h-5">
                    <input type="checkbox" :value="reg" v-model="selectedRegulations" class="peer sr-only" />
                    <div class="w-5 h-5 bg-white/5 border border-white/10 rounded transition-all peer-checked:bg-white peer-checked:border-white"></div>
                    <div class="absolute w-2 h-2 bg-black rounded-[1px] opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                  </div>
                  <span class="text-xs font-label font-medium text-white/40 group-hover:text-white transition-colors uppercase tracking-widest">{{ reg }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div class="flex-1">
        <div class="mb-16">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-[8px] font-mono uppercase tracking-[0.2em] mb-6">
            Exam Papers Hub
          </div>
          <h1 class="text-t1 text-white mb-4">Question Papers<span class="text-white">.</span></h1>
          <p class="text-t3 text-white/40 max-w-2xl leading-relaxed">Browse and download previous year question papers for all subjects.</p>
        </div>

        <div class="flex flex-col md:flex-row items-center gap-6 mb-12">
          <div class="flex-1 w-full">
            <SearchBar 
              v-model="searchQuery"
              placeholder="Search papers..."
              expand-width="100%"
            />
          </div>
          
          <div class="min-w-[240px] w-full md:w-auto">
            <Dropdown 
              v-model="activeSort"
              :options="sortOptions"
              placeholder="Sort By"
            />
          </div>
        </div>

        <div v-if="resourceStore.isLoading" class="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 :size="32" class="animate-spin text-white" />
          <p class="text-sm text-white/40">Loading papers...</p>
        </div>

        <div v-else-if="filteredPapers.length === 0" class="p-20 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-[3rem]">
          <History :size="48" class="text-white/10 mx-auto mb-6" />
          <h3 class="text-xl font-heading font-black text-white/40 mb-2">No Papers Found</h3>
          <p class="text-sm text-white/20">Try selecting a different department or semester.</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-10">
          <TiltCard v-for="paper in filteredPapers" :key="paper.id" class="card group p-0 overflow-hidden border border-white/5 relative">
            <div v-if="config.isSaved(paper.id)" class="absolute top-0 right-0 w-20 h-20 pointer-events-none overflow-hidden z-20">
              <div class="absolute top-4 right-[-32px] rotate-45 bg-white text-black text-[10px] font-black py-1.5 px-10 shadow-2xl">SAVED</div>
            </div>

            <div class="bg-white/[0.02] p-8 flex justify-between items-start border-b border-white/5">
               <div class="w-14 h-14 bg-white/5 text-white rounded-2xl flex items-center justify-center neural-glow group-hover:scale-110 transition-transform">
                  <History :size="28" />
               </div>
               <div class="flex items-center gap-4">
                 <button 
                    @click="config.toggleSave(paper.id)"
                    class="w-12 h-12 rounded-full flex items-center justify-center transition-all bg-white/5 hover:bg-white/20"
                    :class="config.isSaved(paper.id) ? 'text-white' : 'text-white/20 hover:text-white'"
                 >
                    <Bookmark :size="20" :fill="config.isSaved(paper.id) ? 'currentColor' : 'none'" />
                 </button>
                 <div class="text-right">
                   <span class="text-[9px] font-mono font-black uppercase tracking-[0.2em] text-white/20">Type</span>
                   <p class="font-heading font-black text-sm text-white uppercase">{{ paper.resource_type?.replace('_', ' ') }}</p>
                 </div>
               </div>
            </div>
            
            <div class="p-10">
              <div class="flex items-center gap-3 mb-6">
                <span class="px-3 py-1 bg-white/10 text-white text-[9px] font-black uppercase tracking-widest rounded-lg border border-white/20">
                  {{ paper.resource_type?.replace('_', ' ') || 'Paper' }}
                </span>
                <span class="text-[10px] font-mono font-bold text-white/20 uppercase tracking-widest">
                  {{ paper.department?.code || '' }} • SEM {{ paper.subject?.semester || '' }}
                  <template v-if="paper.exam_type"> • {{ paper.exam_type.replace('_', ' ') }}</template>
                  <template v-if="paper.regulation"> • {{ paper.regulation }}</template>
                </span>
              </div>
              <h3 class="text-2xl font-heading font-black text-white group-hover:text-white transition-colors leading-tight mb-8">
                {{ paper.title }}
              </h3>
              
              <div class="flex items-center justify-between pt-8 border-t border-white/5">
                <div class="flex gap-8">
                  <router-link 
                    :to="{ name: 'reader', params: { id: paper.id } }" 
                    class="flex items-center gap-2 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:text-white transition-colors"
                  >
                     <Eye :size="16" />
                     VIEW PAPER
                  </router-link>
                  <button
                    v-if="paper.is_owner"
                    @click="handleDeleteResource(paper.id)"
                    class="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] hover:text-red-400 transition-colors cursor-pointer"
                    title="Delete Resource"
                  >
                     <Trash2 :size="16" />
                     DELETE
                  </button>
                  <router-link 
                    :to="{ name: 'reader', params: { id: paper.id } }" 
                    class="flex items-center gap-2 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:text-white transition-colors cursor-pointer"
                  >
                     <Download :size="16" />
                     DOWNLOAD
                  </router-link>
                </div>
              </div>
            </div>
          </TiltCard>
        </div>
      </div>
    </div>
  </div>
</template>