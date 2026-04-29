<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { ChevronRight, Check, Search } from 'lucide-vue-next';

const props = defineProps({
  modelValue: [String, Number, Object],
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: 'Select option' },
  className: { type: String, default: '' },
  label: { type: String, default: '' }
});

const emit = defineEmits(['update:modelValue', 'change']);

const isOpen = ref(false);
const triggerRef = ref(null);
const contentRef = ref(null);
const inputRef = ref(null);
const searchQuery = ref('');
const isPressed = ref(false);

const filteredOptions = computed(() => {
  if (!searchQuery.value) return props.options;
  const q = searchQuery.value.toLowerCase();
  return props.options.filter(opt => {
    const text = (opt.label || opt).toString().toLowerCase();
    return text.includes(q);
  });
});

const selectedLabel = computed(() => {
  const selected = props.options.find(o => (o.value || o) === props.modelValue);
  return selected ? (selected.label || selected) : '';
});

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    searchQuery.value = '';
    nextTick(() => inputRef.value?.focus());
  }
};

const selectOption = (opt) => {
  const val = opt.value || opt;
  emit('update:modelValue', val);
  emit('change', val);
  isOpen.value = false;
  searchQuery.value = '';
};

const handleClickOutside = (e) => {
  if (triggerRef.value && !triggerRef.value.contains(e.target) && 
      contentRef.value && !contentRef.value.contains(e.target)) {
    isOpen.value = false;
    searchQuery.value = '';
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

watch(() => props.modelValue, () => {
  searchQuery.value = '';
});
</script>

<template>
  <div class="relative w-full" :class="className">
    <label v-if="label" class="block text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-3 ml-2">{{ label }}</label>
    
    <div 
      ref="triggerRef"
      @click="toggleDropdown"
      class="group relative overflow-hidden flex items-center justify-between px-6 py-4 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl cursor-text transition-all hover:border-white/40 hover:bg-white/[0.05] outline-none"
      :class="{ 'border-white/40 ring-4 ring-accent/5': isOpen }"
    >
      <div class="flex items-center gap-3 flex-1">
        <Search v-if="isOpen" :size="14" class="text-white/40" />
        <input 
          ref="inputRef"
          v-model="searchQuery"
          class="bg-transparent border-none outline-none text-sm font-bold text-white w-full placeholder:text-white/40"
          :placeholder="isOpen ? 'Search...' : (selectedLabel || placeholder)"
          @click.stop="isOpen = true"
          @keydown.enter="filteredOptions.length > 0 && selectOption(filteredOptions[0])"
        />
      </div>
      
      <ChevronRight 
        :size="18" 
        class="text-white/20 group-hover:text-white transition-all duration-300 shrink-0"
        :class="{ 'rotate-90': isOpen }"
      />
    </div>

    <transition name="m3-sweep">
      <div 
        v-if="isOpen"
        ref="contentRef"
        class="m3-content absolute z-[100] mt-3 w-full rounded-2xl bg-[#050505]/95 backdrop-blur-3xl border border-white/10 shadow-luxury overflow-hidden py-2"
      >
        <div v-if="filteredOptions.length === 0" class="px-6 py-4 text-sm text-white/20 italic">
          No results found...
        </div>
        
        <div 
          v-for="(opt, idx) in filteredOptions" 
          :key="idx"
          @click="selectOption(opt)"
          class="group relative flex items-center gap-4 px-6 py-4 cursor-pointer select-none transition-colors hover:bg-white/5 m3-item-enter"
          :style="{ '--m3-stagger': idx }"
        >
          <div class="absolute inset-0 opacity-0 group-active:opacity-10 transition-opacity bg-white"></div>
          
          <div class="w-5 h-5 flex items-center justify-center">
            <Check v-if="(opt.value || opt) === modelValue" :size="16" class="text-white" />
          </div>
          
          <span class="text-sm font-medium tracking-wide text-white/60 group-hover:text-white transition-colors">
            {{ opt.label || opt }}
          </span>
          
          <div v-if="opt.desc" class="ml-auto text-[9px] font-mono font-bold text-white/10 uppercase tracking-widest">
            {{ opt.desc }}
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.m3-sweep-enter-active {
  animation: m3-sweep-down 400ms cubic-bezier(0.1, 0.8, 0.2, 1) forwards;
}

.m3-sweep-leave-active {
  animation: m3-sweep-out-up 300ms cubic-bezier(0.4, 0, 1, 1) forwards;
}

@keyframes m3-sweep-down { 
  0% { clip-path: inset(0 0 100% 0 round 1rem); opacity: 0; transform: translateY(-10px); } 
  100% { clip-path: inset(0 0 0 0 round 1rem); opacity: 1; transform: translateY(0); } 
}

@keyframes m3-sweep-out-up { 
  0% { clip-path: inset(0 0 0 0 round 1rem); opacity: 1; transform: translateY(0); } 
  100% { clip-path: inset(0 0 100% 0 round 1rem); opacity: 0; transform: translateY(-10px); } 
}

@keyframes m3-item-cinematic { 
  0% { opacity: 0; transform: translateY(8px) scale(0.98); } 
  100% { opacity: 1; transform: translateY(0) scale(1); } 
}

.m3-item-enter {
  opacity: 0;
  animation: m3-item-cinematic 350ms cubic-bezier(0.1, 0.8, 0.2, 1) forwards;
  animation-delay: calc(var(--m3-stagger, 0) * 30ms + 100ms);
}

.shadow-luxury {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}
</style>

