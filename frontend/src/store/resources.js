import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useAuthStore } from './auth';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002';

export const useResourceStore = defineStore('resources', () => {
  const allResources = ref([]);
  const isLoading = ref(false);
  const error = ref('');
  const pagination = ref({ page: 1, per_page: 20, total: 0, total_pages: 0 });

  async function fetchResources(filters = {}) {
    isLoading.value = true;
    error.value = '';
    const authStore = useAuthStore();

    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          params.set(key, val);
        }
      });

      const headers = {};
      if (authStore.session?.access_token) {
        headers['Authorization'] = `Bearer ${authStore.session.access_token}`;
      }

      const res = await fetch(`${API_BASE}/resources?${params}`, { headers });
      const json = await res.json();

      if (!res.ok || !json.success) {
        error.value = json.message || 'Failed to fetch resources';
        return;
      }

      allResources.value = (json.data || []).map(r => ({
        ...r,
        is_owner: r.is_owner || (authStore.user?.id && authStore.user.id === r.uploaded_by)
      }));
      pagination.value = json.meta || { page: 1, per_page: 20, total: 0, total_pages: 0 };
    } catch (err) {
      error.value = 'Network error — is the server running?';
      console.error('Resource fetch error:', err);
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchResource(id) {
    const authStore = useAuthStore();
    try {
      const headers = {};
      if (authStore.session?.access_token) {
        headers['Authorization'] = `Bearer ${authStore.session.access_token}`;
      }

      const res = await fetch(`${API_BASE}/resources/${id}`, { headers });
      const json = await res.json();
      if (!res.ok || !json.success) return null;
      const r = json.data;
      if (r) {
        r.is_owner = r.is_owner || (authStore.user?.id && authStore.user.id === (r.uploaded_by || r.uploader?.id));
      }
      return r;
    } catch {
      return null;
    }
  }

  const noteResources = computed(() =>
    allResources.value.filter(r => r.resource_type === 'notes')
  );

  const questionPapers = computed(() =>
    allResources.value.filter(r => r.resource_type === 'question_paper')
  );

  const deleteResource = async (id, token) => {
    try {
      const res = await fetch(`${API_BASE}/resources/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        const msg = json.details ? `${json.message}: ${json.details}` : (json.message || 'Failed to delete');
        throw new Error(msg);
      }
      
      allResources.value = allResources.value.filter(r => r.id !== id);
      return true;
    } catch (err) {
      console.error('Delete error:', err);
      throw err;
    }
  };

  return {
    allResources,
    isLoading,
    error,
    pagination,
    fetchResources,
    fetchResource,
    deleteResource,
    noteResources,
    questionPapers
  };
});
