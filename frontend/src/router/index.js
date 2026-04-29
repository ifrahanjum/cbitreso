import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/browse',
      name: 'browse',
      component: () => import('../views/BrowseView.vue')
    },
    {
      path: '/explorer',
      name: 'explorer',
      component: () => import('../views/SubjectExplorerView.vue')
    },
    {
      path: '/question-papers',
      name: 'question-papers',
      component: () => import('../views/QuestionPapersView.vue')
    },
    {
      path: '/schedules',
      name: 'schedules',
      component: () => import('../views/SchedulesView.vue')
    },
    {
      path: '/reader/:id?',
      name: 'reader',
      component: () => import('../views/ReaderView.vue')
    },
    {
      path: '/upload',
      name: 'upload',
      meta: { requiresAuth: true },
      component: () => import('../views/UploadView.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue')
    },
    {
      path: '/syllabus',
      name: 'syllabus',
      component: () => import('../views/SyllabusView.vue')
    }
  ]
});

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    import('../store/auth').then(({ useAuthStore }) => {
      const auth = useAuthStore();
      if (!auth.isAuthenticated) {
        next({ name: 'login', query: { redirect: to.fullPath } });
      } else {
        next();
      }
    });
  } else {
    next();
  }
});

export default router;
