import { createRouter, createWebHashHistory } from 'vue-router'
import DefaultView from '@/features/core/views/DefaultView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      name: 'index',
      path: '/',
      component: DefaultView
    },
    {
      name: 'add-client',
      path: '/add-client',
      component: () => import('@/features/clients/views/AddClientView.vue')
    },
    {
      name: 'edit-client',
      path: '/edit/:id',
      component: () => import('@/features/clients/views/EditClientView.vue')
    },
    {
      name: 'settings',
      path: '/settings',
      component: () => import('@/features/core/views/SettingsView.vue')
    },
    // {
    //   name: 'emails',
    //   path: '/emails',
    //   component: import('@renderer/features/email/views/AllEmailsView.vue')
    // },
    // {
    //   name: 'email',
    //   path: '/emails/:email',
    //   component: import('@renderer/features/email/views/ClientEmailView.vue')
    // },
    // {
    //   name: 'single-email',
    //   path: '/email/:id',
    //   component: import('@renderer/features/email/views/SingleEmailView.vue')
    // }
  ]
})

export default router
