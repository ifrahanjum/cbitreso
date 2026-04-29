<script setup>
import { ref, watch, nextTick } from 'vue';
import { Search, X, Loader2, ArrowRight } from 'lucide-vue-next';
import { useRouter } from 'vue-router';
import { useConfigStore } from '../store/config';
import gsap from 'gsap';

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Search...' },
  expandWidth: { type: String, default: '320px' },
  variant: { type: String, default: 'dock' } 
});

const emit = defineEmits(['update:modelValue', 'search', 'focus', 'blur']);

const router = useRouter();

const isExpanded = ref(props.variant === 'hero');
const inputRef = ref(null);
const containerRef = ref(null);

const suggestions = ref([]);
const isLoadingSuggestions = ref(false);
const showSuggestions = ref(false);
const config = useConfigStore();
const focusedIndex = ref(-1);

let debounceTimer = null;
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

watch(() => props.modelValue, (newVal) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  
  if (!newVal || newVal.trim().length < 2) {
    suggestions.value = [];
    showSuggestions.value = false;
    isLoadingSuggestions.value = false;
    return;
  }

  showSuggestions.value = true;
  isLoadingSuggestions.value = true;
  
  debounceTimer = setTimeout(async () => {
    try {
      const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(newVal)}`);
      const json = await res.json();
      if (json.success) {
        suggestions.value = json.data;
        focusedIndex.value = -1;
      }
    } catch (e) {
      console.error("Failed to fetch suggestions:", e);
    } finally {
      isLoadingSuggestions.value = false;
    }
  }, 300);
});

const handleKeyDown = (e) => {
  if (!showSuggestions.value) return;
  
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (suggestions.value.length > 0) {
      focusedIndex.value = Math.min(focusedIndex.value + 1, suggestions.value.length - 1);
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    focusedIndex.value = Math.max(focusedIndex.value - 1, -1);
  } else if (e.key === 'Enter') {
    if (focusedIndex.value >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions.value[focusedIndex.value]);
    }
  } else if (e.key === 'Escape') {
    showSuggestions.value = false;
  }
};

const selectSuggestion = (s) => {
  showSuggestions.value = false;
  emit('update:modelValue', '');
  
  if (s.payload?.dept || s.payload?.sem) {
    config.sync(
      s.payload.dept || config.dept || 'CSE', 
      s.payload.sem || config.sem || 1
    );
  }

  if (s.type === 'Resource' && s.payload?.id) {
    router.push({ name: 'reader', params: { id: s.payload.id } });
  } else {
    router.push(s.path);
  }
};

const toggleExpand = () => {
  if (props.variant === 'hero') return;
  isExpanded.value = !isExpanded.value;
  if (isExpanded.value) {
    nextTick(() => {
      inputRef.value?.focus();
    });
  } else {
    emit('update:modelValue', '');
    showSuggestions.value = false;
  }
};

const handleClose = () => {
  if (props.variant === 'hero') {
    emit('update:modelValue', '');
    showSuggestions.value = false;
    return;
  }
  isExpanded.value = false;
  showSuggestions.value = false;
  emit('update:modelValue', '');
};

const handleSubmit = (e) => {
  e.preventDefault();
  if (focusedIndex.value >= 0 && suggestions.value.length > 0) {
    selectSuggestion(suggestions.value[focusedIndex.value]);
  } else {
    emit('search', props.modelValue);
    showSuggestions.value = false;
  }
};

const handleBlur = () => {
  emit('blur');
  setTimeout(() => { showSuggestions.value = false; }, 200);
};

const beforeEnter = (el) => {
  if (props.variant === 'hero') return;
  gsap.set(el, { width: '48px', opacity: 0 });
};

const enter = (el, done) => {
  if (props.variant === 'hero') {
    gsap.set(el, { width: '100%', opacity: 1 });
    done();
    return;
  }
  gsap.to(el, {
    width: props.expandWidth,
    opacity: 1,
    duration: 0.6,
    ease: "elastic.out(1, 0.8)",
    onComplete: done
  });
};

const leave = (el, done) => {
  if (props.variant === 'hero') {
    done();
    return;
  }
  gsap.to(el, {
    width: '48px',
    opacity: 0,
    duration: 0.4,
    ease: "power2.inOut",
    onComplete: done
  });
};
</script>

<template>
  <div 
    class="relative flex flex-col justify-end" 
    :class="[variant === 'hero' ? 'w-full items-center' : 'w-full items-end']"
    ref="containerRef"
  >
    <div class="relative flex items-center justify-end" :class="[variant === 'hero' ? 'w-full h-20' : 'h-12 w-full max-w-[320px]']">
      <transition
        mode="out-in"
        @before-enter="beforeEnter"
        @enter="enter"
        @leave="leave"
        :css="false"
      >
        <!-- Collapsed State -->
        <button
          v-if="!isExpanded"
          key="icon"
          @click="toggleExpand"
          class="absolute right-0 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 backdrop-blur-xl text-white hover:bg-white/10 hover:border-white/40 transition-all active:scale-90"
        >
          <Search :size="20" />
        </button>

        <!-- Expanded Form -->
        <form
          v-else
          key="input"
          @submit="handleSubmit"
          class="relative flex items-center overflow-hidden transition-all duration-500 shadow-luxury absolute right-0"
          :class="[
            variant === 'hero' 
              ? 'w-full h-20 px-8 bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-3xl focus-within:border-white/40 focus-within:ring-4 focus-within:ring-accent/5' 
              : 'w-full h-12 rounded-full border border-white/30 bg-white/[0.05] backdrop-blur-2xl'
          ]"
        >
          <div 
            class="text-white/60 group-focus-within:text-white transition-colors"
            :class="variant === 'hero' ? 'mr-6' : 'mr-3 ml-4'"
          >
            <Loader2 v-if="isLoadingSuggestions" :size="variant === 'hero' ? 24 : 16" class="animate-spin text-accent" />
            <Search v-else :size="variant === 'hero' ? 24 : 16" />
          </div>
          
          <input
            ref="inputRef"
            type="text"
            :value="modelValue"
            @input="e => emit('update:modelValue', e.target.value)"
            @focus="emit('focus'); if(modelValue.length > 1) showSuggestions = true;"
            @blur="handleBlur"
            @keydown="handleKeyDown"
            :placeholder="placeholder"
            class="h-full flex-1 bg-transparent text-white outline-none placeholder:text-white/20"
            :class="variant === 'hero' ? 'text-lg font-heading' : 'text-sm font-medium pr-4'"
          />
          
          <button
            v-if="modelValue && variant === 'dock'"
            type="button"
            @mousedown.prevent="handleClose"
            class="mr-2 flex h-8 w-8 items-center justify-center rounded-full text-white/40 hover:bg-white/10 hover:text-white transition-all active:scale-90 shrink-0"
          >
            <X :size="16" />
          </button>

          <button 
            v-if="variant === 'hero'"
            type="submit"
            class="px-8 h-12 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-white transition-all shadow-lg shadow-white/20 active:scale-95 shrink-0"
          >
            Find
          </button>
        </form>
      </transition>
    </div>

    <!-- Suggestions Dropdown -->
    <div 
      v-if="showSuggestions" 
      class="absolute left-0 right-0 top-full mt-2 bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50 flex flex-col"
      :class="variant === 'hero' ? 'w-full' : 'ml-auto w-full max-w-[320px]'"
    >
        <div v-if="isLoadingSuggestions && suggestions.length === 0" class="p-6 flex items-center justify-center text-white/50">
          <Loader2 :size="20" class="animate-spin" />
        </div>
        <div v-else-if="!isLoadingSuggestions && suggestions.length === 0" class="p-6 text-center text-white/40 text-xs font-medium">
          No matching resources found.
        </div>
        <ul v-else class="py-2 max-h-80 overflow-y-auto custom-scrollbar">
          <li 
            v-for="(s, index) in suggestions" 
            :key="s.name + s.type"
            @mousedown.prevent="selectSuggestion(s)"
            @mouseenter="focusedIndex = index"
            :class="['px-4 py-3 flex flex-col gap-1 cursor-pointer transition-colors', focusedIndex === index ? 'bg-white/10' : 'hover:bg-white/5']"
          >
              <div class="flex items-center justify-between">
                <span class="text-sm font-bold text-white truncate pr-4 leading-tight">{{ s.name }}</span>
                <ArrowRight v-if="focusedIndex === index" :size="14" class="text-white/50 shrink-0" />
              </div>
              <div class="flex items-center gap-2 text-[9px] font-mono font-bold uppercase tracking-widest text-white/40">
                <span class="px-1.5 py-0.5 border border-white/10 bg-white/5 rounded text-white/80">{{ s.type }}</span>
                <span class="truncate">{{ s.meta }}</span>
              </div>
          </li>
        </ul>
    </div>
  </div>
</template>

<style scoped>
.shadow-luxury {
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5), 0 0 20px -5px rgba(255, 255, 255, 0.1);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
