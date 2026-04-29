<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useConfigStore } from '../store/config';
import { useCurriculumStore } from '../store/curriculum';
import SearchBar from '../components/SearchBar.vue';
import Dropdown from '../components/Dropdown.vue';
import TiltCard from '../components/TiltCard.vue';
import { BookOpen, Search, Download, ExternalLink, Code, Database, Cpu, Layout, FileText, Blocks, Terminal, X, Loader2 } from 'lucide-vue-next';
import parsedSyllabus from '../data/parsed_syllabus.json';

const config = useConfigStore();
const curriculumStore = useCurriculumStore();

const activeDept = ref(config.dept || 'CSE');
const activeSem = ref(config.sem ? `Sem ${config.sem}` : 'Sem 1');
const searchQuery = ref('');
const activeCategory = ref('All');
const selectedCourse = ref(null);

const departments = ['CSE', 'ECE', 'EEE', 'MEC', 'CIV', 'IT', 'AIML', 'CSE-AIML', 'CET', 'AIDS', 'CHEM', 'BIO'];
const semesters = Array.from({ length: 8 }, (_, i) => ({ label: `Sem ${i + 1}`, value: `Sem ${i + 1}` }));
const categories = ['All', 'Theory', 'Practical', 'Elective', 'Mandatory'];

const injectUnits = (code) => parsedSyllabus[code] || [];

async function loadSubjects() {
  const semNum = parseInt(activeSem.value.replace('Sem ', ''));
  await curriculumStore.fetchSubjects(activeDept.value, semNum);
}

const syllabusData = computed(() => {
  return curriculumStore.subjects.map(item => ({
    ...item,
    sem: `Sem ${item.semester}`,
    dept: activeDept.value,
    type: 'Theory', 
    icon: 'BookOpen',
    credits: 3, 
    units: injectUnits(item.code)
  }));
});

const filteredSyllabus = computed(() => {
  let result = syllabusData.value;

  if (activeCategory.value !== 'All') {
    result = result.filter(item => item.type === activeCategory.value);
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(item => 
      item.name.toLowerCase().includes(q) || 
      (item.code && item.code.toLowerCase().includes(q))
    );
  }

  return result;
});

const getIcon = (iconName) => {
  const icons = { BookOpen, Code, Database, Cpu, Layout, FileText, Blocks, Terminal };
  return icons[iconName] || BookOpen;
};

const downloadPDF = () => {
  window.open('/R22A-Schema-Syllabus-BECSE-I-VIII-Semesters-Open-Electives.pdf', '_blank');
};

watch([activeDept, activeSem], loadSubjects);
onMounted(loadSubjects);
</script>

<template>
  <div class="min-h-screen relative">
    
    <header class="relative z-10 pt-32 pb-10 border-b border-white/5 bg-white/[0.02] backdrop-blur-md">
      <div class="max-w-7xl mx-auto px-6">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-[8px] font-mono uppercase tracking-[0.2em] mb-6">
              Curriculum Hub
            </div>
            <h1 class="text-t1 text-white mb-4">Course Syllabus<span class="text-white">.</span></h1>
            <p class="text-t3 text-white/40 max-w-2xl leading-relaxed">
              Explore the detailed curriculum, credits, and structure of courses across all semesters.
            </p>
          </div>
          
          <button 
            @click="downloadPDF"
            class="flex items-center gap-3 px-6 py-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/40 text-white transition-all group"
          >
            <Download :size="18" class="text-white group-hover:scale-110 transition-transform" />
            <span class="text-xs font-bold uppercase tracking-widest">Download Full PDF</span>
          </button>
        </div>
      </div>
    </header>

    <main class="relative z-10 max-w-7xl mx-auto px-6 py-12">
      <div class="flex flex-col lg:flex-row gap-6 mb-12 bg-surface-low/50 backdrop-blur-xl border border-white/5 rounded-3xl p-4">
        
        <div class="flex-1 w-full lg:w-auto">
          <SearchBar 
            v-model="searchQuery"
            placeholder="Search by course name or code..."
            expand-width="100%"
          />
        </div>

        <div class="flex flex-wrap lg:flex-nowrap gap-4">
          <div class="w-full sm:w-[160px]">
            <Dropdown 
              v-model="activeDept"
              :options="departments"
              placeholder="Department"
            />
          </div>
          <div class="w-full sm:w-[160px]">
            <Dropdown 
              v-model="activeSem"
              :options="semesters"
              placeholder="Semester"
            />
          </div>
          <div class="w-full sm:w-[160px]">
            <Dropdown 
              v-model="activeCategory"
              :options="categories"
              placeholder="Type"
            />
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        <div class="glass-panel-luxury p-6 rounded-2xl bg-surface-low border border-white/5">
          <div class="text-sm text-white/40 font-mono tracking-widest uppercase mb-2">Total Credits</div>
          <div class="text-3xl font-black text-white">{{ filteredSyllabus.reduce((acc, curr) => acc + curr.credits, 0) }}</div>
        </div>
        <div class="glass-panel-luxury p-6 rounded-2xl bg-surface-low border border-white/5">
          <div class="text-sm text-white/40 font-mono tracking-widest uppercase mb-2">Courses</div>
          <div class="text-3xl font-black text-white">{{ filteredSyllabus.length }}</div>
        </div>
        <div class="glass-panel-luxury p-6 rounded-2xl bg-surface-low border border-white/5">
          <div class="text-sm text-white/40 font-mono tracking-widest uppercase mb-2">Department</div>
          <div class="text-3xl font-black text-white">{{ activeDept }}</div>
        </div>
        <div class="glass-panel-luxury p-6 rounded-2xl bg-surface-low border border-white/5">
          <div class="text-sm text-white/40 font-mono tracking-widest uppercase mb-2">Semester</div>
          <div class="text-3xl font-black text-white">{{ activeSem.split(' ')[1] }}</div>
        </div>
      </div>

      <div v-if="filteredSyllabus.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <TiltCard 
          v-for="course in filteredSyllabus" 
          :key="course.id"
          @click="selectedCourse = course"
          class="p-6 border border-white/5 bg-surface-low rounded-3xl group cursor-pointer hover:border-white/30 transition-all flex flex-col h-full"
        >
          <div class="flex items-start justify-between mb-6">
            <div class="w-12 h-12 bg-white/5 text-white rounded-xl flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors">
              <component :is="getIcon(course.icon)" :size="20" />
            </div>
            <div class="px-3 py-1 rounded-full bg-white/5 text-[9px] font-mono font-bold uppercase tracking-widest text-white/60 border border-white/10 group-hover:border-white/40 group-hover:text-white transition-colors">
              {{ course.type }}
            </div>
          </div>
          
          <h3 class="text-lg font-heading font-bold text-white mb-2 line-clamp-2 leading-snug flex-1">{{ course.name }}</h3>
          
          <div class="flex items-center justify-between mt-6 pt-6 border-t border-white/5">
            <div class="text-xs font-mono tracking-widest text-white/40">{{ course.id }}</div>
            <div class="flex items-center gap-2 text-white/80 font-bold text-sm bg-white/5 px-3 py-1 rounded-lg">
              {{ course.credits }} <span class="text-[9px] uppercase tracking-widest text-white/40 font-normal">CR</span>
            </div>
          </div>
        </TiltCard>
      </div>

      <div v-else class="py-32 text-center flex flex-col items-center justify-center">
        <div class="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center text-white/20 mb-6">
          <BookOpen :size="40" />
        </div>
        <h3 class="text-2xl font-heading font-bold text-white mb-2">No courses found</h3>
        <p class="text-white/40 max-w-md">We couldn't find any courses matching your criteria. Try adjusting your search or filters.</p>
      </div>

    </main>

    <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="selectedCourse" class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm" @click.self="selectedCourse = null">
        <div class="glass-panel-luxury bg-[#050505] w-full max-w-3xl max-h-[85vh] rounded-3xl overflow-hidden flex flex-col border border-white/10 shadow-2xl relative" style="animation: hero-zoom 0.4s cubic-bezier(0.1, 0.8, 0.2, 1) forwards;">
          <button @click="selectedCourse = null" class="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all z-10">
            <X :size="20" />
          </button>
          
          <div class="p-8 md:p-10 border-b border-white/5 bg-white/[0.02]">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 bg-white/10 text-white rounded-xl flex items-center justify-center">
                 <component :is="getIcon(selectedCourse.icon)" :size="20" />
              </div>
              <div class="px-3 py-1 rounded-full bg-white/5 text-[10px] font-mono font-bold uppercase tracking-widest text-white/60 border border-white/10">
                {{ selectedCourse.id }}
              </div>
              <div class="px-3 py-1 rounded-full bg-white/5 text-[10px] font-mono font-bold uppercase tracking-widest text-white border border-white/20">
                {{ selectedCourse.type }}
              </div>
            </div>
            <h2 class="text-3xl md:text-4xl font-heading font-black text-white mb-2 leading-tight pr-12">{{ selectedCourse.name }}</h2>
            <p class="text-white/40 font-mono tracking-widest uppercase text-xs">{{ selectedCourse.dept }} • {{ selectedCourse.sem }} • {{ selectedCourse.credits }} Credits</p>
          </div>
          
          <div class="p-8 md:p-10 overflow-y-auto flex-1 custom-scrollbar">
            <div v-if="selectedCourse.units && selectedCourse.units.length > 0" class="flex flex-col gap-8">
              <div v-for="(unit, idx) in selectedCourse.units" :key="idx" class="relative pl-8">
                <div class="absolute left-0 top-2 bottom-0 w-px bg-white/10" :class="{'bottom-[-32px]': idx !== selectedCourse.units.length - 1}"></div>
                <div class="absolute left-[-4px] top-2 w-[9px] h-[9px] rounded-full bg-white ring-4 ring-[#050505]"></div>
                
                <h4 class="text-lg font-bold text-white mb-2">Unit {{ idx + 1 }}: {{ unit.title }}</h4>
                <p class="text-sm text-white/50 leading-relaxed">{{ unit.content }}</p>
              </div>
            </div>
            <div v-else class="py-16 text-center flex flex-col items-center">
              <div class="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-white/20 mb-4">
                <FileText :size="24" />
              </div>
              <h3 class="text-xl font-bold text-white mb-2">Detailed Syllabus Unavailable</h3>
              <p class="text-white/40 text-sm max-w-md mx-auto">The unit-by-unit breakdown for this course is currently being digitized. Please download the full PDF to view the detailed syllabus.</p>
              <button @click="downloadPDF" class="mt-6 px-6 py-3 rounded-xl bg-white/10 text-white border border-white/20 font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all">
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<style scoped>
.hero-zoom {
  animation: hero-zoom 1s cubic-bezier(0.1, 0.8, 0.2, 1) forwards;
}

@keyframes hero-zoom {
  0% { opacity: 0; transform: scale(0.95) translateY(20px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

.shadow-luxury {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>