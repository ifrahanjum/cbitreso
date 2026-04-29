import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export const useConfigStore = defineStore('config', () => {
  const dept = ref(localStorage.getItem('user_dept') || '');
  const semValue = localStorage.getItem('user_sem');
  const sem = ref(semValue ? Number(semValue) : '');
  const isSynced = ref(!!(dept.value && sem.value));

  const savedResources = ref(JSON.parse(localStorage.getItem('saved_resources') || '[]'));

  const sync = (newDept, newSem) => {
    dept.value = newDept;
    sem.value = newSem;
    isSynced.value = true;
    localStorage.setItem('user_dept', newDept);
    localStorage.setItem('user_sem', newSem);
  };

  const clearSync = () => {
    dept.value = '';
    sem.value = '';
    isSynced.value = false;
    localStorage.removeItem('user_dept');
    localStorage.removeItem('user_sem');
  };

  const toggleSave = (id) => {
    const index = savedResources.value.indexOf(id);
    if (index === -1) {
      savedResources.value.push(id);
    } else {
      savedResources.value.splice(index, 1);
    }
    localStorage.setItem('saved_resources', JSON.stringify(savedResources.value));
  };

  const isSaved = (id) => savedResources.value.includes(id);

  return { dept, sem, isSynced, savedResources, sync, clearSync, toggleSave, isSaved };
});
