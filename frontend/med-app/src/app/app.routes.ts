import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'anomaly-detection',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./anomaly-detection/anomaly-detection.component').then(m => m.AnomalyDetectionComponent)
  },
  {
    path: 'cancer-detection',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./cancer-detection/cancer-detection.component').then(m => m.CancerDetectionComponent)
  },
  {
    path: 'chatbot',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./chatbot/chatbot.component').then(m => m.ChatbotComponent)
  }
];
