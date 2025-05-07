import { Routes } from '@angular/router';
import { LessonsPageComponent } from './pages/lessons-page/lessons-page.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { AuthPageComponent } from './auth/auth-page/auth-page.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { TestPageComponent } from './pages/test-page/test-page.component';


export const routes: Routes = [
    {
        path: '',
        component: MainLayoutComponent, // головна сторінка
        children:[
            {
              path: '',
              loadComponent: () =>
                import('./pages/main-content/main-content.component').then((m) => m.MainContentComponent),
            },
            {
                path: 'lessons',
                component: LessonsPageComponent, 
            },
            {
                path: 'profile',
                component: ProfileComponent,
            },
            {
                path: 'lessons/test',
                component: TestPageComponent,
            }
        ],
    },
    {
        path: 'auth',
        component: AuthLayoutComponent,
        children: [
            {
                path: '',
                component: AuthPageComponent,
            },
        ],
    },
    {
        path: '**',
        redirectTo: '',
    },
]