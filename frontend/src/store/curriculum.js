import { defineStore } from 'pinia';
import { ref } from 'vue';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const useCurriculumStore = defineStore('curriculum', () => {
  const subjects = ref([]);
  const departments = ref([]);
  const isLoading = ref(false);
  const error = ref('');

  async function fetchDepartments() {
    try {
      const res = await fetch(`${API_BASE}/departments`);
      const json = await res.json();
      if (json.success) departments.value = json.data;
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  }

  
  async function fetchSubjects(deptCode = 'CSE', semester = null) {
    isLoading.value = true;
    error.value = '';

    try {
      let url = `${API_BASE}/departments/${deptCode}/subjects?regulation=R22`;
      if (semester) url += `&semester=${semester}`;

      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok || !json.success) {
        error.value = json.message || 'Failed to fetch subjects';
        return;
      }

      subjects.value = json.data || [];
    } catch (err) {
      error.value = 'Network error — is the server running?';
      console.error('Subject fetch error:', err);
    } finally {
      isLoading.value = false;
    }
  }

  return {
    subjects,
    departments,
    isLoading,
    error,
    fetchDepartments,
    fetchSubjects
  };
});
