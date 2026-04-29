import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useConfigStore } from './config';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002';


function calculateSemesterFromRoll(rollNo) {
  if (!rollNo || rollNo.length < 6) return null;
  const yearPart = rollNo.substring(4, 6);
  const admissionYear = parseInt(yearPart, 10);
  if (isNaN(admissionYear)) return null;

  const fullAdmissionYear = 2000 + admissionYear;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); 

  let semester;
  if (currentMonth >= 6) {
    semester = (currentYear - fullAdmissionYear) * 2 + 1;
  } else {
    semester = (currentYear - fullAdmissionYear) * 2;
  }

  return Math.min(Math.max(semester, 1), 8);
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const session = ref(null);
  const isLoading = ref(false);
  const error = ref('');
  const configStore = useConfigStore();

  const isAuthenticated = computed(() => !!session.value && !!user.value);
  const token = computed(() => session.value?.access_token || null);
  const displayName = computed(() => user.value?.displayName || user.value?.identifier || '');
  const userRole = computed(() => user.value?.role || '');
  const userDept = computed(() => user.value?.dept || '');


  async function login(type, identifier, password) {
    isLoading.value = true;
    error.value = '';

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, identifier, password })
      });

      const data = await res.json();

      if (!res.ok) {
        error.value = data.error || 'Authentication failed';
        return false;
      }

      user.value = data.user;
      session.value = data.session;

      localStorage.setItem('reso_session', JSON.stringify(data.session));
      localStorage.setItem('reso_user', JSON.stringify(data.user));

  
      if (data.user.type === 'student') {
        const semester = calculateSemesterFromRoll(data.user.identifier);
        if (data.user.dept && semester) {
          configStore.sync(data.user.dept, semester);
        }
      } else if (data.user.type === 'faculty') {
        if (data.user.dept) {
          configStore.sync(data.user.dept, configStore.sem || '');
        }
      }

      return true;
    } catch (err) {
      error.value = 'Network error — is the server running?';
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function logout() {
    try {
      if (session.value?.access_token) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: session.value.access_token })
        });
      }
    } catch {
    }

    user.value = null;
    session.value = null;
    localStorage.removeItem('reso_session');
    localStorage.removeItem('reso_user');
    
    configStore.clearSync();
  }

  function checkSession() {
    try {
      const savedSession = localStorage.getItem('reso_session');
      const savedUser = localStorage.getItem('reso_user');

      if (savedSession && savedUser) {
        const parsed = JSON.parse(savedSession);

        if (parsed.expires_at && Date.now() / 1000 > parsed.expires_at) {
          localStorage.removeItem('reso_session');
          localStorage.removeItem('reso_user');
          return;
        }

        session.value = parsed;
        user.value = JSON.parse(savedUser);
      }
    } catch {
      localStorage.removeItem('reso_session');
      localStorage.removeItem('reso_user');
    }
  }

  return {
    user,
    session,
    isLoading,
    error,
    isAuthenticated,
    displayName,
    userRole,
    userDept,
    token,
    login,
    logout,
    checkSession
  };
});
