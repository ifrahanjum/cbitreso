<script setup>
import { 
  ChevronRight, ArrowLeft, BookOpen, FileText, LayoutGrid, GraduationCap, 
  Layers, RefreshCw, Eye, Download, Search, Filter, Bookmark, Loader2, Trash2 
} from 'lucide-vue-next';
import { ref, computed, watch, onMounted } from 'vue';
import { useConfigStore } from '../store/config';
import { useResourceStore } from '../store/resources';
import { useCurriculumStore } from '../store/curriculum';
import { useAuthStore } from '../store/auth';
import TiltCard from '../components/TiltCard.vue';
import Dropdown from '../components/Dropdown.vue';
import SearchBar from '../components/SearchBar.vue';

const config = useConfigStore();
const resourceStore = useResourceStore();
const curriculumStore = useCurriculumStore();
const authStore = useAuthStore();
const currentStep = ref(config.isSynced ? 'subject' : 'dept');
const activeSort = ref('alpha');
const searchQuery = ref('');
const selection = ref({
  dept: config.dept || '',
  sem: config.sem || '',
  subject: '',
  subject_id: null,
  unit: ''
});

const getResourcesForType = (type) => {
  const typeMap = {
    'Notes': 'notes',
    'Question Papers': 'question_paper',
    'Question Banks': 'question_bank',
    'Important Questions': 'important_questions'
  };
  const apiType = typeMap[type] || type.toLowerCase().replace(/\s+/g, '_');
  
  return resourceStore.allResources.filter(res => 
    res.subject?.id === selection.value.subject_id && 
    res.resource_type === apiType
  ).sort((a, b) => {
    const aSaved = config.isSaved(a.id);
    const bSaved = config.isSaved(b.id);
    if (aSaved && !bSaved) return -1;
    if (!aSaved && bSaved) return 1;
    return 0;
  });
};

const sortOptions = [
  { label: 'Alphabetical', value: 'alpha' },
  { label: 'Course Code', value: 'code' }
];

const sortedSubjects = computed(() => {
  let filtered = curriculumStore.subjects;

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    filtered = filtered.filter(s => s.name.toLowerCase().includes(q) || (s.code && s.code.toLowerCase().includes(q)));
  }
  return [...filtered].sort((a, b) => {
    if (activeSort.value === 'alpha') return a.name.localeCompare(b.name);
    if (activeSort.value === 'code') return (a.code || '').localeCompare(b.code || '');
    return 0;
  });
});
onMounted(() => {
  if (currentStep.value === 'subject' && selection.value.dept && selection.value.sem) {
    curriculumStore.fetchSubjects(selection.value.dept, selection.value.sem);
  }
});

const departments = [
  { id: 'CSE', name: 'CSE' },
  { id: 'ECE', name: 'ECE' },
  { id: 'EEE', name: 'EEE' },
  { id: 'MEC', name: 'MEC' },
  { id: 'CIV', name: 'CIV' },
  { id: 'IT', name: 'IT' },
  { id: 'AIML', name: 'AIML' },
  { id: 'CSE-AIML', name: 'CSE-AIML' },
  { id: 'CET', name: 'CET' },
  { id: 'AIDS', name: 'AIDS' },
  { id: 'CHEM', name: 'CHEM' },
  { id: 'BIO', name: 'BIO' }
];

const selectDept = (id) => {
  selection.value.dept = id;
  currentStep.value = 'sem';
};

const selectSem = async (num) => {
  selection.value.sem = num;
  await curriculumStore.fetchSubjects(selection.value.dept, num);
  currentStep.value = 'subject';
};

const selectSubject = async (sub) => {
  selection.value.subject = sub.name;
  selection.value.subject_id = sub.id;
  await resourceStore.fetchResources({
    subject_id: sub.id,
    per_page: 50
  });
  currentStep.value = 'content';
};

const goBack = () => {
  if (currentStep.value === 'sem') currentStep.value = 'dept';
  else if (currentStep.value === 'subject') currentStep.value = 'sem';
  else if (currentStep.value === 'content') currentStep.value = 'subject';
};

const handleDeleteResource = async (id) => {
  if (!confirm('Are you sure you want to delete this resource? This action cannot be undone.')) return;
  try {
    await resourceStore.deleteResource(id, authStore.token);
  } catch (err) {
    alert(err.message || 'Failed to delete resource');
  }
};
</script>

<template>
  <div class="max-w-7xl mx-auto px-6 py-12">
    <div class="flex items-center gap-6 mb-16">
      <button 
        v-if="currentStep !== 'dept'"
        @click="goBack"
        class="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all group"
      >
        <ArrowLeft :size="20" class="group-hover:scale-110 transition-transform" />
      </button>
      
      <div class="flex items-center gap-4 text-[10px] font-mono font-black uppercase tracking-[0.2em]">
        <span :class="currentStep === 'dept' ? 'text-white' : 'text-white/40'">Departments</span>
        <template v-if="selection.dept">
          <ChevronRight :size="14" class="text-white/20" />
          <span :class="currentStep === 'sem' ? 'text-white' : 'text-white/40'">{{ selection.dept }}</span>
        </template>
        <template v-if="selection.sem">
          <ChevronRight :size="14" class="text-white/20" />
          <span :class="currentStep === 'subject' ? 'text-white' : 'text-white/40'">Sem {{ selection.sem }}</span>
        </template>
        <template v-if="selection.subject">
          <ChevronRight :size="14" class="text-white/20" />
          <span :class="currentStep === 'content' ? 'text-white' : 'text-white/40'">{{ selection.subject }}</span>
        </template>
      </div>
    </div>

    <div v-if="currentStep === 'dept'">
      <div class="mb-16">
        <h1 class="text-t1 text-white mb-4">Choose Department<span class="text-white">.</span></h1>
        <p class="text-t3 text-white/40">Select your branch to begin exploring available study materials.</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <TiltCard 
          v-for="dept in departments" 
          :key="dept.id"
          @click="selectDept(dept.id)"
          class="card group cursor-pointer border border-white/5 flex flex-col items-center text-center py-16"
        >
          <div class="w-20 h-20 bg-white/5 text-white rounded-3xl flex items-center justify-center mb-8 group-hover:neural-glow transition-all group-hover:-translate-y-2">
             <GraduationCap :size="40" />
          </div>
          <h3 class="text-2xl font-heading font-black text-white mb-2 group-hover:text-white transition-colors">{{ dept.name }}</h3>
          <p class="text-[10px] font-mono font-bold text-white/20 uppercase tracking-widest">{{ dept.id }} Knowledge Node</p>
        </TiltCard>
      </div>
    </div>

    <div v-if="currentStep === 'sem'">
      <div class="mb-16">
        <h1 class="text-t1 text-white mb-4">Select Semester<span class="text-white">.</span></h1>
        <p class="text-t3 text-white/40 leading-relaxed">Current Selection: <span class="text-white font-bold">{{ selection.dept }} Branch</span></p>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
        <TiltCard 
          v-for="i in 8" 
          :key="i"
          @click="selectSem(i)"
          class="card group cursor-pointer border border-white/5 flex flex-col items-center text-center py-12"
        >
          <span class="text-6xl font-heading font-black text-white/5 group-hover:text-white/20 transition-all mb-4">{{ i }}</span>
          <h3 class="text-xl font-bold text-white group-hover:text-white transition-colors">Semester {{ i }}</h3>
        </TiltCard>
      </div>
    </div>

    <div v-if="currentStep === 'subject'">
      <div class="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h1 class="text-t1 text-white mb-4">Select Subject<span class="text-white">.</span></h1>
          <p class="text-t3 text-white/40">Showing subjects for <span class="text-white font-bold">Sem {{ selection.sem }} • {{ selection.dept }}</span></p>
        </div>
        
        <div class="flex flex-col sm:flex-row items-center gap-6">
          <SearchBar 
            v-model="searchQuery"
            placeholder="Search subjects..."
            expand-width="300px"
          />
          <div class="min-w-[200px]">
            <Dropdown 
              v-model="activeSort"
              :options="sortOptions"
              placeholder="Sort By"
            />
          </div>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <TiltCard 
          v-for="sub in sortedSubjects" 
          :key="sub.id"
          @click="selectSubject(sub)"
          class="card group cursor-pointer border border-white/5 flex items-center gap-8 p-10"
        >
          <div class="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white/20 group-hover:bg-white group-hover:text-black group-hover:neural-glow transition-all">
             <BookOpen :size="28" />
          </div>
          <div>
            <div class="flex items-center gap-2 mb-2 text-[9px] font-mono font-black text-white opacity-60">
              <span>{{ sub.id }}101</span>
              <span class="w-1 h-1 bg-white/30 rounded-full"></span>
              <span>R22 REGULATION</span>
            </div>
            <h3 class="text-2xl font-heading font-black text-white group-hover:text-white transition-colors">{{ sub.name }}</h3>
          </div>
          <div class="ml-auto w-10 h-10 rounded-full border border-white/5 flex items-center justify-center group-hover:border-white transition-colors">
            <ChevronRight class="text-white/20 group-hover:text-white" :size="20" />
          </div>
        </TiltCard>
      </div>
    </div>

    <div v-if="currentStep === 'content'">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-12">
        <div class="lg:col-span-1">
          <div class="sticky top-40 space-y-8">
            <div class="flex items-center gap-3 text-white mb-10">
              <Layers :size="20" />
              <h2 class="text-[10px] font-mono font-black uppercase tracking-[0.4em]">Syllabus Units</h2>
            </div>
            <div class="space-y-4">
               <button 
                v-for="i in 5" 
                :key="i"
                class="w-full flex items-center justify-between p-5 rounded-2xl transition-all border group"
                :class="selection.unit === i ? 'bg-white text-black border-white shadow-lg shadow-white/20' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:border-white/10'"
                @click="selection.unit = i"
               >
                 <span class="font-bold text-sm">Unit {{ i }}</span>
                 <div :class="selection.unit === i ? 'bg-black/20' : 'bg-white/10'" class="w-6 h-6 rounded-md flex items-center justify-center transition-colors">
                   <Layers :size="14" />
                 </div>
               </button>
            </div>
            
            <div class="p-8 bg-white/[0.02] border border-white/5 rounded-3xl">
              <h4 class="text-[9px] font-mono font-black uppercase tracking-[0.2em] text-white/20 mb-4">More Info</h4>
              <p class="text-xs text-white/40 leading-relaxed font-label">
                Currently browsing <span class="text-white font-bold">{{ selection.subject }}</span> resources.
              </p>
            </div>
          </div>
        </div>

        <div class="lg:col-span-3">
          <div class="flex items-center justify-between mb-16">
            <div>
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-[8px] font-mono uppercase tracking-[0.2em] mb-6">
                Subject Resources
              </div>
              <h1 class="text-t1 text-white mb-4">{{ selection.subject }}</h1>
              <p class="text-t3 text-white/40">Hand-picked notes and materials for this subject.</p>
            </div>
          </div>

          <div class="space-y-24">
            <section v-for="type in ['Notes', 'Important Questions', 'Question Banks', 'Academic Schedule']" :key="type">
               <div class="flex items-center justify-between mb-10 pb-4 border-b border-white/5">
                 <div class="flex items-center gap-4">
                   <div class="w-12 h-12 bg-white/5 text-white rounded-xl flex items-center justify-center neural-glow">
                      <FileText :size="24" />
                   </div>
                   <h2 class="text-2xl font-heading font-black text-white">{{ type }}</h2>
                 </div>
                 <span class="text-[9px] font-mono text-white/20 uppercase tracking-widest">Type_ID: 0{{ type.length }}</span>
               </div>

               <div v-if="getResourcesForType(type).length === 0" class="p-12 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
                 <p class="text-white/20 text-sm italic">No resources found for this category.</p>
               </div>

               <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div v-for="res in getResourcesForType(type)" :key="res.id" class="card group border border-white/5 hover:border-white/20 p-10 relative overflow-hidden">
                   <div v-if="config.isSaved(res.id)" class="absolute top-0 right-0 w-16 h-16 pointer-events-none overflow-hidden z-10">
                     <div class="absolute top-2 right-[-24px] rotate-45 bg-white text-black text-[8px] font-black py-1 px-8 shadow-lg">SAVED</div>
                   </div>

                   <div class="flex justify-between items-start mb-8">
                     <h4 class="font-heading font-black text-xl text-white group-hover:text-white transition-colors leading-tight max-w-[80%]">{{ res.title }}</h4>
                     <div class="flex flex-col gap-2 items-center">
                       <button 
                          @click="config.toggleSave(res.id)"
                          class="w-10 h-10 rounded-xl flex items-center justify-center transition-all bg-white/5 hover:bg-white/20"
                          :class="config.isSaved(res.id) ? 'text-white' : 'text-white/20 hover:text-white'"
                       >
                          <Bookmark :size="16" :fill="config.isSaved(res.id) ? 'currentColor' : 'none'" />
                       </button>
                       <div class="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/20 group-hover:text-white transition-colors">
                          <FileText :size="18" />
                       </div>
                     </div>
                   </div>
                   
                   <div class="flex items-center justify-between text-[10px] font-mono font-bold text-white/30 uppercase tracking-widest pt-8 border-t border-white/5">
                      <div class="flex gap-6">
                        <span class="flex items-center gap-2"><div class="w-1 h-1 bg-white rounded-full"></div> PDF • 4.2 MB</span>
                        <span class="flex items-center gap-2"><div class="w-1 h-1 bg-white/20 rounded-full"></div> Unit {{ res.unit || 'ALL' }}</span>
                      </div>
                      <div class="flex gap-4">
                        <button
                          v-if="res.is_owner"
                          @click="handleDeleteResource(res.id)"
                          class="text-red-500 hover:text-red-400 transition-colors flex items-center gap-2 cursor-pointer"
                          title="Delete Resource"
                        >
                          <Trash2 :size="14" />
                          DEL
                        </button>
                        <router-link 
                          :to="{ name: 'reader', params: { id: res.id } }" 
                          class="text-white hover:text-white transition-colors flex items-center gap-2"
                        >
                          <Eye :size="14" />
                          VIEW
                        </router-link>
                        <router-link 
                          :to="{ name: 'reader', params: { id: res.id } }" 
                          class="text-white hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <Download :size="14" />
                          DL
                        </router-link>
                      </div>
                   </div>
                 </div>
               </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>