<script setup>
import { CloudUpload, FileText, CheckCircle2, ShieldOff, File, AlertTriangle, Loader2, X } from 'lucide-vue-next';
import GradientBlinds from '../components/GradientBlinds.vue';
import { ref, computed, watch, onMounted } from 'vue';
import { useConfigStore } from '../store/config';
import { useAuthStore } from '../store/auth';
import { useCurriculumStore } from '../store/curriculum';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const config = useConfigStore();
const auth = useAuthStore();
const curriculumStore = useCurriculumStore();

const step = ref(1);
const fileInput = ref(null);
const selectedFile = ref(null);
const isUploading = ref(false);
const uploadProgress = ref(0);
const uploadError = ref('');
const uploadResult = ref(null);

const formData = ref({
  title: '',
  subjectId: '',
  dept: config.dept || 'CSE',
  sem: config.sem || '1',
  resourceType: 'notes',
  description: '',
  isAnonymous: false,
  unit: null,
  examType: '',
  regulation: ''
});

const departments = ['CSE', 'ECE', 'EEE', 'MEC', 'CIV', 'IT', 'AIML', 'CSE-AIML', 'CET', 'AIDS', 'CHEM', 'BIO'];
const resourceTypes = [
  { value: 'notes', label: 'Notes' },
  { value: 'question_paper', label: 'Question Paper' },
  { value: 'question_bank', label: 'Question Bank' },
  { value: 'course_pack', label: 'Course Pack' },
  { value: 'important_questions', label: 'Important Questions' },
  { value: 'calendar', label: 'Academic Schedule' },
];

const isCalendarType = computed(() => formData.value.resourceType === 'calendar');

// Load subjects when dept/sem changes
async function loadSubjects() {
  if (formData.value.dept && formData.value.sem) {
    await curriculumStore.fetchSubjects(formData.value.dept, formData.value.sem);
    formData.value.subjectId = '';
  }
}

watch(() => [formData.value.dept, formData.value.sem], loadSubjects);
onMounted(loadSubjects);

const triggerFileInput = () => fileInput.value.click();

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // Client-side size check
  if (file.size > 25 * 1024 * 1024) {
    uploadError.value = 'File exceeds 25MB limit.';
    return;
  }

  selectedFile.value = file;
  uploadError.value = '';
  // Auto-fill title from filename
  if (!formData.value.title) {
    formData.value.title = file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ');
  }
  step.value = 2;
};

const removeFile = () => {
  selectedFile.value = null;
  fileInput.value.value = '';
  step.value = 1;
};

const formatSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const canSubmit = computed(() => {
  const hasTitle = formData.value.title.length >= 5;
  const hasFile = !!selectedFile.value;
  // Calendars don't require a subject
  if (isCalendarType.value) {
    return hasTitle && hasFile;
  }
  const base = hasTitle && formData.value.subjectId && hasFile;
  if (formData.value.resourceType === 'question_paper') {
    return base && formData.value.examType && formData.value.regulation;
  }
  return base;
});

const selectedSubjectName = computed(() => {
  const subject = curriculumStore.subjects.find(s => s.id == formData.value.subjectId);
  return subject?.name || '';
});

// Upload via XMLHttpRequest for progress tracking
async function submitUpload() {
  if (!canSubmit.value) return;

  isUploading.value = true;
  uploadProgress.value = 0;
  uploadError.value = '';

  const fd = new FormData();
  fd.append('file', selectedFile.value);
  fd.append('title', formData.value.title);
  fd.append('resource_type', formData.value.resourceType);
  fd.append('description', formData.value.description);
  fd.append('is_anonymous', formData.value.isAnonymous);
  // Calendar type: send dept+sem, skip subject_id
  if (isCalendarType.value) {
    fd.append('dept', formData.value.dept);
    fd.append('sem', formData.value.sem);
  } else {
    fd.append('subject_id', formData.value.subjectId);
  }
  if (formData.value.unit) fd.append('unit', formData.value.unit);
  if (formData.value.resourceType === 'question_paper') {
    fd.append('exam_type', formData.value.examType);
    fd.append('regulation', formData.value.regulation);
  }

  try {
    const xhr = new XMLHttpRequest();

    const result = await new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          uploadProgress.value = Math.round((e.loaded / e.total) * 100);
        }
      });

      xhr.addEventListener('load', () => {
        try {
          const json = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && json.success) {
            resolve(json);
          } else {
            reject(new Error(json.message || 'Upload failed'));
          }
        } catch {
          reject(new Error('Invalid response from server'));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Network error')));
      xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

      xhr.open('POST', `${API_BASE}/resources`);
      xhr.setRequestHeader('Authorization', `Bearer ${auth.session?.access_token}`);
      xhr.send(fd);
    });

    uploadResult.value = result;
    step.value = 4; // Success
  } catch (err) {
    uploadError.value = err.message || 'Upload failed. Please try again.';
  } finally {
    isUploading.value = false;
  }
}

const resetForm = () => {
  step.value = 1;
  selectedFile.value = null;
  uploadProgress.value = 0;
  uploadError.value = '';
  uploadResult.value = null;
  formData.value.title = '';
  formData.value.subjectId = '';
  formData.value.description = '';
  formData.value.isAnonymous = false;
  if (fileInput.value) fileInput.value.value = '';
};
</script>

<template>
  <div class="relative min-h-screen">
    <!-- GradientBlinds Background -->
    <div class="fixed inset-0 z-0" style="width: 100vw; height: 100vh;">
      <GradientBlinds
        :gradientColors="['#000000', '#222222', '#ffffff', '#111111']"
        :angle="20"
        :noise="0.3"
        :blindCount="12"
        :blindMinWidth="50"
        :spotlightRadius="0.5"
        :spotlightSoftness="1"
        :spotlightOpacity="1"
        :mouseDampening="0.15"
        :distortAmount="0"
        shineDirection="left"
        mixBlendMode="normal"
      />
    </div>

    <div class="relative z-10 max-w-3xl mx-auto px-6 py-16">
    <!-- Progress Indicator -->
    <div class="flex items-center justify-center gap-4 mb-16">
      <div v-for="s in [1, 2, 3]" :key="s" class="flex items-center gap-4">
        <div 
          :class="[
            'w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all text-sm',
            step >= s ? 'bg-white text-black' : 'bg-white/5 text-white/30'
          ]"
        >
          <CheckCircle2 v-if="step > s" :size="18" />
          <span v-else>{{ s }}</span>
        </div>
        <div v-if="s < 3" class="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
          <div :class="['h-full bg-white transition-all duration-500', step > s ? 'w-full' : 'w-0']"></div>
        </div>
      </div>
    </div>

    <div class="glass-panel-luxury p-10 min-h-[400px] flex flex-col rounded-3xl">
      <!-- Step 1: File Selection -->
      <div v-if="step === 1" class="flex-1 flex flex-col">
        <div class="text-center mb-10">
          <h2 class="text-3xl font-heading font-black text-white mb-2">Upload Resource</h2>
          <p class="text-white/40">Share your materials with the CBIT community.</p>
        </div>

        <input 
          type="file" 
          ref="fileInput" 
          class="hidden" 
          @change="handleFileChange"
          accept=".pdf,.docx,.pptx,.doc,.ppt"
        />

        <div 
          @click="triggerFileInput"
          class="flex-1 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center p-12 hover:border-white/40 transition-colors cursor-pointer group"
        >
          <div class="w-16 h-16 bg-white/5 text-white rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <CloudUpload :size="32" />
          </div>
          <p class="text-lg font-bold text-white mb-2">Drag and drop your file here</p>
          <p class="text-white/40 mb-8">PDF, DOCX, or PPTX up to 25MB</p>
          <button class="px-8 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-bold text-sm hover:bg-white/10 transition-all">Browse Files</button>
        </div>

        <p v-if="uploadError" class="mt-4 text-red-400 text-sm text-center">{{ uploadError }}</p>
      </div>

      <!-- Step 2: Metadata -->
      <div v-if="step === 2" class="flex-1">
        <div class="mb-10 flex justify-between items-start">
          <div>
            <h2 class="text-2xl font-heading font-black text-white mb-2">Resource Details</h2>
            <p class="text-white/40">Tell us more about what you're uploading.</p>
          </div>
          <div class="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-xl">
            <File :size="16" class="text-white" />
            <span class="text-xs font-bold text-white truncate max-w-[150px]">{{ selectedFile?.name }}</span>
            <button @click="removeFile" class="text-white/30 hover:text-red-400 transition-colors ml-1">
              <X :size="14" />
            </button>
          </div>
        </div>

        <div class="space-y-6">
          <!-- Title -->
          <div>
            <label class="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Resource Title *</label>
            <input v-model="formData.title" type="text" placeholder="e.g. Data Structures Unit 1 Notes" 
              class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-white/40 focus:ring-1 focus:ring-accent/20 outline-none transition-all" />
            <p v-if="formData.title && formData.title.length < 5" class="text-red-400/80 text-xs mt-1">At least 5 characters required</p>
          </div>

          <!-- Dept + Sem -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label class="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Department</label>
              <select v-model="formData.dept" class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white appearance-none focus:border-white/40 outline-none transition-all">
                <option v-for="d in departments" :key="d" :value="d" class="bg-[#0a0a0a]">{{ d }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Semester</label>
              <select v-model="formData.sem" class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white appearance-none focus:border-white/40 outline-none transition-all">
                <option v-for="i in 8" :key="i" :value="i" class="bg-[#0a0a0a]">Semester {{ i }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Type *</label>
              <select v-model="formData.resourceType" class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white appearance-none focus:border-white/40 outline-none transition-all">
                <option v-for="rt in resourceTypes" :key="rt.value" :value="rt.value" class="bg-[#0a0a0a]">{{ rt.label }}</option>
              </select>
            </div>
          </div>

          <!-- Subject (from API) — hidden for calendar type -->
          <div v-if="!isCalendarType">
            <label class="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Subject *</label>
            <select v-model="formData.subjectId" class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white appearance-none focus:border-white/40 outline-none transition-all">
              <option value="" disabled class="bg-[#0a0a0a]">
                {{ curriculumStore.isLoading ? 'Loading subjects...' : 'Select a subject' }}
              </option>
              <option v-for="sub in curriculumStore.subjects" :key="sub.id" :value="sub.id" class="bg-[#0a0a0a]">
                {{ sub.name }} ({{ sub.code }})
              </option>
            </select>
          </div>
          <!-- Calendar info -->
          <div v-else class="p-4 bg-white/[0.03] border border-white/5 rounded-xl">
            <p class="text-white/40 text-sm">📅 Academic schedules apply to the entire department — no specific subject needed.</p>
          </div>

          <!-- Question Paper Details (Conditional) -->
          <div v-if="formData.resourceType === 'question_paper'" class="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white/[0.03] border border-white/5 rounded-2xl">
            <div>
              <label class="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Exam Type *</label>
              <select v-model="formData.examType" class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white appearance-none focus:border-white/40 outline-none transition-all">
                <option value="" disabled class="bg-[#0a0a0a]">Select Exam</option>
                <option value="MID-1" class="bg-[#0a0a0a]">MID-1</option>
                <option value="MID-2" class="bg-[#0a0a0a]">MID-2</option>
                <option value="SEMESTER_END" class="bg-[#0a0a0a]">SEMESTER END</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Regulation *</label>
              <select v-model="formData.regulation" class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white appearance-none focus:border-white/40 outline-none transition-all">
                <option value="" disabled class="bg-[#0a0a0a]">Select Regulation</option>
                <option value="R22" class="bg-[#0a0a0a]">R22</option>
                <option value="R20" class="bg-[#0a0a0a]">R20</option>
                <option value="R18" class="bg-[#0a0a0a]">R18</option>
              </select>
            </div>
          </div>

          <!-- Unit Selection -->
          <div>
            <label class="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Unit (Optional)</label>
            <div class="flex flex-wrap gap-4">
              <button 
                v-for="i in 5" 
                :key="i"
                type="button"
                @click="formData.unit = formData.unit === i ? null : i"
                :class="[
                  'px-4 py-2 rounded-xl border font-bold text-sm transition-all',
                  formData.unit === i ? 'bg-white text-black border-white shadow-lg shadow-white/20' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                ]"
              >
                Unit {{ i }}
              </button>
            </div>
            <p class="text-[9px] font-mono text-white/20 mt-3 uppercase tracking-wider italic">Leave unselected for "All Units"</p>
          </div>

          <!-- Description -->
          <div>
            <label class="block text-xs font-black uppercase tracking-widest text-white/40 mb-2">Description (Optional)</label>
            <textarea v-model="formData.description" placeholder="Briefly describe the content..." rows="3"
              class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-white/40 outline-none transition-all resize-none"></textarea>
          </div>

          <!-- Error -->
          <p v-if="uploadError" class="text-red-400 text-sm flex items-center gap-2">
            <AlertTriangle :size="14" /> {{ uploadError }}
          </p>

          <div class="pt-6 flex justify-between">
            <button @click="step = 1" class="text-white/40 font-bold hover:text-white transition-colors">Back</button>
            <button @click="step = 3" :disabled="!canSubmit" 
              :class="['px-10 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all', canSubmit ? 'bg-white text-black hover:bg-white' : 'bg-white/5 text-white/20 cursor-not-allowed']">
              Continue
            </button>
          </div>
        </div>
      </div>

      <!-- Step 3: Review & Submit -->
      <div v-if="step === 3" class="flex-1">
        <div class="mb-10 text-center">
          <div class="w-16 h-16 bg-white/10 text-white rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText :size="32" />
          </div>
          <h2 class="text-2xl font-heading font-black text-white mb-2">Ready to publish?</h2>
          <p class="text-white/40">Review your details before sharing.</p>
        </div>

        <div class="bg-white/[0.03] border border-white/5 rounded-2xl p-6 mb-8 space-y-4">
          <div class="flex justify-between">
            <span class="text-white/40 text-sm">File</span>
            <span class="font-bold text-white truncate ml-4 text-sm">{{ selectedFile?.name }} ({{ formatSize(selectedFile?.size || 0) }})</span>
          </div>
          <div class="flex justify-between">
            <span class="text-white/40 text-sm">Title</span>
            <span class="font-bold text-white text-sm">{{ formData.title }}</span>
          </div>
          <div v-if="!isCalendarType" class="flex justify-between">
            <span class="text-white/40 text-sm">Subject</span>
            <span class="font-bold text-white text-sm">{{ selectedSubjectName }}</span>
          </div>
          <div v-else class="flex justify-between">
            <span class="text-white/40 text-sm">Scope</span>
            <span class="font-bold text-white text-sm">{{ formData.dept }} — All Subjects</span>
          </div>
          <div class="flex justify-between">
            <span class="text-white/40 text-sm">Category</span>
            <span class="font-bold text-white text-sm">{{ formData.dept }} • Sem {{ formData.sem }} • {{ resourceTypes.find(r => r.value === formData.resourceType)?.label }}</span>
          </div>
        </div>

        <!-- Anonymous toggle -->
        <div class="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl mb-8">
          <div class="flex items-center gap-3">
             <ShieldOff class="text-amber-400" :size="20" />
             <div>
                <p class="font-bold text-sm text-white">Upload Anonymously</p>
                <p class="text-xs text-white/30">Your name won't be visible to others.</p>
             </div>
          </div>
          <input v-model="formData.isAnonymous" type="checkbox" class="w-6 h-6 rounded border-white/10 bg-white/5 text-white focus:ring-accent/20" />
        </div>

        <!-- Upload progress -->
        <div v-if="isUploading" class="mb-8">
          <div class="flex justify-between text-sm mb-2">
            <span class="text-white/40">Uploading...</span>
            <span class="text-white font-bold">{{ uploadProgress }}%</span>
          </div>
          <div class="w-full h-2 bg-white/5 rounded-full overflow-hidden">
            <div class="h-full bg-white rounded-full transition-all duration-300" :style="{ width: uploadProgress + '%' }"></div>
          </div>
        </div>

        <!-- Error -->
        <p v-if="uploadError" class="text-red-400 text-sm flex items-center gap-2 mb-6">
          <AlertTriangle :size="14" /> {{ uploadError }}
        </p>

        <div class="flex gap-4">
          <button @click="step = 2" :disabled="isUploading" class="flex-1 px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-bold text-sm hover:bg-white/10 transition-all disabled:opacity-30">Back to Edit</button>
          <button @click="submitUpload" :disabled="isUploading" 
            class="flex-1 px-6 py-3 bg-white text-black rounded-xl font-black text-sm uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            <Loader2 v-if="isUploading" :size="16" class="animate-spin" />
            {{ isUploading ? 'Uploading...' : 'Confirm & Publish' }}
          </button>
        </div>
      </div>

      <!-- Step 4: Success -->
      <div v-if="step === 4" class="flex-1 flex flex-col items-center justify-center py-12">
        <div class="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mb-8 animate-bounce">
          <CheckCircle2 :size="48" />
        </div>
        <h2 class="text-3xl font-heading font-black text-white mb-3 text-center">Successfully Uploaded!</h2>
        <p class="text-white/40 text-center max-w-sm mb-4">
          Your resource is now live and visible in the Hub.
        </p>
        
        <!-- Duplicate warning -->
        <div v-if="uploadResult?.data?.is_duplicate_flagged" class="flex items-center gap-3 px-6 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-8 max-w-sm">
          <AlertTriangle :size="18" class="text-amber-400 shrink-0" />
          <p class="text-amber-400 text-xs">This file appears to be a duplicate of an existing resource.</p>
        </div>

        <div class="flex gap-4">
          <router-link to="/browse" class="px-8 py-3 bg-white text-black rounded-xl font-black text-sm uppercase tracking-widest hover:bg-white transition-all">Browse All</router-link>
          <button @click="resetForm" class="px-8 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-bold text-sm hover:bg-white/10 transition-all">Upload More</button>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

