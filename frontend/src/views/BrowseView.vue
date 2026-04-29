<script setup>
import { Search, Filter, Download, ChevronRight, BookOpen, ArrowUpDown, Clock, ThumbsUp, Eye, Bookmark, Loader2, Trash2 } from 'lucide-vue-next';
import { ref, computed, watch, onMounted } from 'vue';
import { useConfigStore } from '../store/config';
import { useResourceStore } from '../store/resources';
import { useAuthStore } from '../store/auth';
import { useRoute } from 'vue-router';

const route = useRoute();
const config = useConfigStore();
const resourceStore = useResourceStore();
const authStore = useAuthStore();
const departments = ['CSE', 'ECE', 'EEE', 'MEC', 'CIV', 'IT', 'AIML', 'CSE-AIML', 'CET', 'AIDS', 'CHEM', 'BIO'];
const activeDept = ref(config.dept || 'CSE');
const activeSem = ref(config.sem || '');
const activeSubject = ref('');
const activeUnit = ref('');
const activeSort = ref('newest');
const searchQuery = ref(route.query.search || route.query.q || '');
const subjects = ref([]);

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

watch(() => route.query, (newQuery) => {
  if (newQuery.search !== undefined || newQuery.q !== undefined) {
    searchQuery.value = newQuery.search || newQuery.q || '';
  }
});

const sortOptions = [
  { label: 'Newest First', value: 'newest', icon: Clock },
  { label: 'Most Downloaded', value: 'downloads', icon: Download },
  { label: 'Most Popular', value: 'popular', icon: ThumbsUp },
];

const selectedTypes = ref([]);

async function fetchSubjects() {
  if (!activeDept.value) return;
  try {
    const url = `${API_BASE}/departments/${activeDept.value}/subjects${activeSem.value ? `?semester=${activeSem.value}` : ''}`;
    const res = await fetch(url);
    const json = await res.json();
    if (json.success) {
      subjects.value = json.data;
      if (activeSubject.value && !subjects.value.some(s => s.id === parseInt(activeSubject.value))) {
        activeSubject.value = '';
      }
    }
  } catch (err) {
    console.error('Failed to fetch subjects:', err);
  }
}

const sortMap = { newest: 'created_at', downloads: 'download_count', popular: 'download_count' };

async function loadResources() {
  const filters = { department: activeDept.value, per_page: 50 };
  if (activeSem.value) filters.semester = activeSem.value;
  if (activeSubject.value) filters.subject_id = activeSubject.value;
  if (activeUnit.value) filters.unit = activeUnit.value;
  if (searchQuery.value.trim()) filters.search = searchQuery.value.trim();
  filters.sort = sortMap[activeSort.value] || 'created_at';
  filters.order = 'desc';
  if (selectedTypes.value.length === 1) {
    const typeMap = { 'Notes': 'notes', 'Question Papers': 'question_paper', 'Question Banks': 'question_bank', 'Syllabus': 'notes' };
    filters.resource_type = typeMap[selectedTypes.value[0]] || '';
  }
  await resourceStore.fetchResources(filters);
}

const resources = computed(() => {
  let items = [...resourceStore.allResources];
  return items.sort((a, b) => {
    const aSaved = config.isSaved(a.id);
    const bSaved = config.isSaved(b.id);
    if (aSaved && !bSaved) return -1;
    if (!aSaved && bSaved) return 1;
    return 0;
  });
});

watch([activeDept, activeSem, activeSort, selectedTypes, activeSubject, activeUnit], loadResources);
watch([activeDept, activeSem], fetchSubjects);

const handleFilterChange = () => {
  loadResources();
};

const handleDeleteResource = async (id) => {
  if (!confirm('Are you sure you want to delete this resource? This action cannot be undone.')) return;
  try {
    await resourceStore.deleteResource(id, authStore.token);
  } catch (err) {
    alert(err.message || 'Failed to delete resource');
  }
};

let searchTimer;
watch(searchQuery, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadResources, 400);
});

import DOMPurify from 'dompurify';

const highlightText = (text, query) => {
  if (!text) return '';
  if (!query || !query.trim()) {
    return DOMPurify.sanitize(String(text));
  }
  
  const escapedQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  
  const safeText = DOMPurify.sanitize(String(text));
  
  return safeText.replace(regex, '<mark class="bg-accent/20 text-accent rounded px-0.5 font-bold">$1</mark>');
};

onMounted(() => {
  fetchSubjects();
  loadResources();
});
</script>

<template>
  <div class="max-w-7xl mx-auto px-6 py-12">
    <div class="flex flex-col lg:flex-row gap-12">
      <aside class="w-full lg:w-64 shrink-0">
        <div class="sticky top-32">
          <div class="flex items-center gap-2 mb-8">
            <Filter :size="20" class="text-black" />
            <h2 class="text-xl font-bold">Refine Results</h2>
          </div>

          <div class="mb-10">
            <h4 class="text-xs font-black uppercase tracking-widest text-text-secondary/60 mb-4">Department</h4>
            <div class="space-y-2 max-h-64 overflow-y-auto pr-2">
              <button 
                v-for="dept in departments" 
                :key="dept"
                @click="activeDept = dept"
                :class="[
                  'w-full text-left px-4 py-2 rounded-lg transition-all font-medium text-sm',
                  activeDept === dept ? 'bg-white text-black' : 'hover:bg-surface-high text-text-secondary'
                ]"
              >
                {{ dept }}
              </button>
            </div>
          </div>

          <div class="mb-10">
            <h4 class="text-xs font-black uppercase tracking-widest text-text-secondary/60 mb-4">Semester</h4>
            <select v-model="activeSem" class="w-full input-field py-2 text-sm appearance-none">
              <option value="">All Semesters</option>
              <option v-for="i in 8" :key="i" :value="i">Semester {{ i }}</option>
            </select>
          </div>

          <div class="mb-10">
            <h4 class="text-xs font-black uppercase tracking-widest text-text-secondary/60 mb-4">Subject</h4>
            <select v-model="activeSubject" class="w-full input-field py-2 text-sm appearance-none" :disabled="subjects.length === 0">
              <option value="">{{ subjects.length > 0 ? 'All Subjects' : 'No subjects found' }}</option>
              <option v-for="sub in subjects" :key="sub.id" :value="sub.id">{{ sub.name }}</option>
            </select>
          </div>

          <div class="mb-10">
            <h4 class="text-xs font-black uppercase tracking-widest text-text-secondary/60 mb-4">Unit</h4>
            <div class="flex flex-wrap gap-2">
              <button 
                v-for="i in 5" 
                :key="i"
                @click="activeUnit = activeUnit == i ? '' : i"
                :class="[
                  'px-3 py-1.5 rounded-lg border text-xs font-bold transition-all',
                  activeUnit == i ? 'bg-black text-white border-black shadow-sm' : 'bg-surface-low border-surface-high text-text-secondary hover:bg-surface-high'
                ]"
              >
                U{{ i }}
              </button>
            </div>
          </div>

          <div class="mb-10">
            <h4 class="text-xs font-black uppercase tracking-widest text-text-secondary/60 mb-4">Content Type</h4>
            <div class="space-y-3">
              <label v-for="type in ['Notes', 'Question Papers', 'Question Banks']" :key="type" class="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" :value="type" v-model="selectedTypes" class="w-5 h-5 rounded border-surface-highest text-white focus:ring-accent/20" />
                <span class="text-sm text-text-secondary group-hover:text-text-black transition-colors">{{ type }}</span>
              </label>
            </div>
          </div>
        </div>
      </aside>

      <div class="flex-1">
        <div class="mb-8">
          <div class="flex flex-col md:flex-row gap-4 mb-8">
            <div class="flex-1 relative">
              <Search class="absolute left-4 top-3.5 text-text-secondary" :size="20" />
              <input 
                v-model="searchQuery"
                type="text" 
                :placeholder="`Search in ${activeDept}...`" 
                class="w-full pl-12 pr-4 py-3.5 bg-surface-low rounded-xl border-none focus:ring-2 focus:ring-primary/10 outline-none transition-all"
              />
            </div>
            
            <div class="relative group">
              <div class="flex items-center gap-2 px-4 py-3.5 bg-surface-lowest border border-surface-high rounded-xl cursor-pointer hover:bg-surface-low transition-colors">
                <ArrowUpDown :size="18" class="text-text-secondary" />
                <span class="text-sm font-bold min-w-[120px]">{{ sortOptions.find(o => o.value === activeSort)?.label }}</span>
              </div>
              <div class="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-ambient border border-surface-high opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 p-2">
                <button 
                  v-for="opt in sortOptions" 
                  :key="opt.value"
                  @click="activeSort = opt.value"
                  class="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm hover:bg-surface-low transition-colors"
                  :class="activeSort === opt.value ? 'text-white bg-white/5 font-bold' : 'text-text-secondary'"
                >
                  <component :is="opt.icon" :size="16" />
                  {{ opt.label }}
                </button>
              </div>
            </div>
          </div>
          
          <div class="flex items-center justify-between py-4 border-b border-surface-high/50">
            <div class="flex items-center gap-2 text-text-secondary text-sm">
               <span>Departments</span>
               <ChevronRight :size="14" />
               <span class="text-text-black font-bold">{{ activeDept }}</span>
            </div>
            <p class="text-sm text-text-secondary">
              <template v-if="resourceStore.isLoading">Loading...</template>
              <template v-else>Found <span class="font-bold text-text-black">{{ resourceStore.pagination.total }}</span> results</template>
            </p>
          </div>
        </div>

        <div v-if="resourceStore.isLoading" class="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 :size="32" class="animate-spin text-white" />
          <p class="text-sm text-text-secondary">Loading resources...</p>
        </div>

        <div v-else-if="resourceStore.error" class="text-center py-20">
          <p class="text-red-400 font-bold mb-2">{{ resourceStore.error }}</p>
          <button @click="loadResources" class="px-6 py-2 bg-white text-black rounded-lg font-bold text-sm">Retry</button>
        </div>

        <div v-else-if="resources.length === 0" class="text-center py-20">
          <BookOpen :size="48" class="mx-auto text-text-secondary/30 mb-4" />
          <p class="text-text-secondary font-bold">No resources found for this filter combination.</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="res in resources" :key="res.id" class="card flex flex-col group h-full border border-transparent hover:border-black/10 relative overflow-hidden">
            <div v-if="config.isSaved(res.id)" class="absolute top-0 right-0 w-16 h-16 pointer-events-none overflow-hidden">
              <div class="absolute top-2 right-[-24px] rotate-45 bg-white text-black text-[8px] font-black py-1 px-8 shadow-lg">SAVED</div>
            </div>

            <div class="mb-6 flex justify-between items-start">
               <div class="w-10 h-10 bg-surface-high rounded-lg flex items-center justify-center text-text-secondary group-hover:bg-black/10 group-hover:text-black transition-colors">
                  <BookOpen :size="20" />
               </div>
               <div class="flex items-center gap-2">
                 <button 
                    @click="config.toggleSave(res.id)"
                    class="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                    :class="config.isSaved(res.id) ? 'bg-white/20 text-white' : 'bg-surface-high text-text-secondary hover:text-white'"
                 >
                    <Bookmark :size="14" :fill="config.isSaved(res.id) ? 'currentColor' : 'none'" />
                 </button>
                 <span v-if="res.unit" class="px-2 py-0.5 bg-black text-white text-[10px] font-black rounded-full uppercase tracking-tighter">
                   Unit {{ res.unit }}
                 </span>
                 <span class="px-2 py-0.5 bg-white text-black text-[10px] font-black rounded-full uppercase tracking-tighter">
                   {{ res.resource_type?.replace('_', ' ') || 'notes' }}
                 </span>
               </div>
            </div>
            
            <h3 class="font-bold text-lg mb-2 group-hover:text-black transition-colors leading-snug" v-html="highlightText(res.title, searchQuery)">
            </h3>
            <p class="text-sm text-text-secondary mb-2 flex-1 line-clamp-2 italic" v-html="highlightText(res.description, searchQuery)">
            </p>
            <p v-if="res.subject" class="text-[10px] font-bold text-text-secondary/50 uppercase tracking-wider mb-4">
              {{ res.subject.name }} · Sem {{ res.subject.semester }}
            </p>
            
            <div class="pt-6 border-t border-surface-high/50 flex items-center justify-between">
              <div class="flex gap-4">
                <a :href="res.file_url" target="_blank" download class="flex items-center gap-1.5 text-[10px] font-bold text-text-secondary hover:text-white uppercase tracking-tight transition-colors cursor-pointer">
                  <Download :size="12" />
                  <span>{{ res.download_count || 0 }}</span>
                </a>
              </div>
              <div class="flex gap-2">
                <button
                  v-if="res.is_owner"
                  @click="handleDeleteResource(res.id)"
                  class="w-10 h-10 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                  title="Delete Resource"
                >
                  <Trash2 :size="18" />
                </button>
                <router-link 
                  :to="{ name: 'reader', params: { id: res.id } }"
                  class="w-10 h-10 bg-surface-low text-text-secondary rounded-full flex items-center justify-center hover:bg-black/10 hover:text-black transition-all"
                >
                  <Eye :size="18" />
                </router-link>
                <router-link 
                  :to="{ name: 'reader', params: { id: res.id } }"
                  class="w-10 h-10 bg-surface-high text-text-black rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all shadow-sm"
                >
                  <Download :size="18" />
                </router-link>
              </div>
            </div>
          </div>
        </div>

        <div v-if="resourceStore.pagination.total_pages > 1" class="mt-16 flex justify-center gap-2">
          <button 
            v-for="p in resourceStore.pagination.total_pages" :key="p"
            @click="resourceStore.fetchResources({ department: activeDept, semester: activeSem || undefined, page: p, per_page: 50 })"
            :class="[
              'w-10 h-10 rounded-lg flex items-center justify-center transition-colors',
              p === resourceStore.pagination.page ? 'bg-white text-black font-bold shadow-lg shadow-white/20' : 'bg-surface-high text-text-secondary hover:bg-surface-highest'
            ]"
          >{{ p }}</button>
        </div>
      </div>
    </div>
  </div>
</template>