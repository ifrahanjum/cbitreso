<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { 
  ArrowLeft, Download, Maximize2, Minimize2, 
  ChevronLeft, ChevronRight, Printer, Share2, Info, Loader2, Trash2
} from 'lucide-vue-next';
import { useAuthStore } from '../store/auth';
import { useResourceStore } from '../store/resources';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const resourceStore = useResourceStore();
const isFullscreen = ref(false);
const isLoading = ref(true);
const error = ref(null);

const resource = ref(null);

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

onMounted(async () => {
  try {
    const id = route.params.id;
    if (!id) throw new Error("No resource ID provided");

    const data = await resourceStore.fetchResource(id);
    if (!data) throw new Error("Failed to load resource");
    
    resource.value = data;
  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
});

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
};

const formatSize = (bytes) => {
  if (!bytes) return 'Unknown Size';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const handleDeleteResource = async () => {
  if (!confirm('Are you sure you want to delete this resource? This action cannot be undone.')) return;
  try {
    await resourceStore.deleteResource(resource.value.id, authStore.token);
    router.back();
  } catch (err) {
    alert(err.message || 'Failed to delete resource');
  }
};

const iframeSrc = computed(() => {
  if (!resource.value?.file_url) return '';
  const url = resource.value.file_url;
  const ext = url.split('.').pop().toLowerCase();
  
  if (['doc', 'docx', 'ppt', 'pptx'].includes(ext)) {
    return `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
  }
  return url;
});
</script>

<template>
  <div :class="['min-h-screen bg-neutral-900 flex flex-col transition-all', isFullscreen ? 'fixed inset-0 z-[100]' : '']">
    <div v-if="isLoading" class="flex-1 flex items-center justify-center text-white/50">
      <Loader2 :size="32" class="animate-spin" />
    </div>
    <div v-else-if="error" class="flex-1 flex flex-col items-center justify-center text-white/50">
      <p class="text-red-400 mb-4">{{ error }}</p>
      <button @click="router.back()" class="px-6 py-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all text-white font-bold text-sm">Go Back</button>
    </div>
    
    <template v-else>
      <div class="h-16 bg-neutral-800 border-b border-neutral-700 flex items-center justify-between px-6 shrink-0">
        <div class="flex items-center gap-4">
          <button @click="router.back()" class="p-2 text-neutral-400 hover:text-white transition-colors">
            <ArrowLeft :size="20" />
          </button>
          <div class="hidden md:block">
            <h1 class="text-white font-bold text-sm truncate max-w-[300px]">{{ resource.title }}</h1>
            <p class="text-neutral-500 text-[10px] uppercase font-black tracking-widest">{{ resource.resource_type?.replace('_', ' ') }}</p>
          </div>
        </div>

        <div class="flex items-center gap-2 md:gap-6">
          <div class="flex items-center gap-2">
            <button
              v-if="resource.is_owner"
              @click="handleDeleteResource"
              class="w-10 h-10 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all mr-2"
              title="Delete Resource"
            >
              <Trash2 :size="18" />
            </button>
            <button @click="toggleFullscreen" class="p-2 text-neutral-400 hover:text-white transition-colors" title="Toggle Fullscreen">
              <component :is="isFullscreen ? Minimize2 : Maximize2" :size="20" />
            </button>
            <a :href="resource.file_url" target="_blank" download class="btn-primary !px-4 !py-2 text-xs flex items-center gap-2">
              <Download :size="16" />
              Download
            </a>
          </div>
        </div>
      </div>

      <div class="flex-1 flex overflow-hidden">
        <aside class="hidden lg:flex w-72 bg-neutral-800 border-r border-neutral-700 flex-col p-6 overflow-y-auto shrink-0">
           <div class="mb-8">
             <h3 class="text-white font-bold mb-4 flex items-center gap-2">
               <Info :size="16" class="text-white" />
               Details
             </h3>
             <div class="space-y-4 text-xs">
                <div>
                  <p class="text-neutral-500 uppercase font-black tracking-tighter mb-1">Uploaded By</p>
                  <p class="text-neutral-300">{{ resource.uploader?.name || 'Anonymous' }}</p>
                </div>
                <div>
                  <p class="text-neutral-500 uppercase font-black tracking-tighter mb-1">Date</p>
                  <p class="text-neutral-300">{{ formatDate(resource.created_at) }}</p>
                </div>
                <div>
                  <p class="text-neutral-500 uppercase font-black tracking-tighter mb-1">Size</p>
                  <p class="text-neutral-300">{{ formatSize(resource.file_size) }}</p>
                </div>
                <div>
                  <p class="text-neutral-500 uppercase font-black tracking-tighter mb-1">Subject</p>
                  <p class="text-neutral-300">{{ resource.subject?.name }} ({{ resource.subject?.code }})</p>
                </div>
             </div>

             <div class="mt-8 space-y-4">
                <a :href="resource.file_url" target="_blank" download class="w-full flex items-center justify-between px-6 py-4 bg-white text-black rounded-xl hover:bg-neutral-200 transition-colors font-bold tracking-tight">
                  <span class="flex items-center gap-2"><Download :size="18"/> Download</span>
                  <span class="text-xs opacity-50">{{ formatSize(resource.file_size) }}</span>
                </a>
                
                <button 
                  v-if="resource.is_owner"
                  @click="handleDeleteResource"
                  class="w-full flex items-center justify-center gap-2 px-6 py-4 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all font-bold tracking-tight"
                >
                  <Trash2 :size="18"/> Delete Resource
                </button>
           </div>
         </div>
       </aside>

        <main class="flex-1 bg-neutral-900 overflow-hidden flex flex-col">
           <iframe v-if="iframeSrc" :src="iframeSrc" class="w-full h-full border-none bg-white"></iframe>
           <div v-else class="flex-1 flex items-center justify-center text-white/30">
              No preview available for this file type.
           </div>
        </main>
      </div>
    </template>
  </div>
</template>

<style scoped>
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: #171717;
}
::-webkit-scrollbar-thumb {
  background: #404040;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #525252;
}
</style>