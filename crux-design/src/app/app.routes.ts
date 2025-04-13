import { Routes } from '@angular/router';
import { LessonsPageComponent } from './pages/lessons-page/lessons-page.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { AuthPageComponent } from './auth/auth-page/auth-page.component';

export const routes: Routes = [
    {
        path: '',
        component: MainLayoutComponent, // головна сторінка
        children:[
            {
              path: '',
              loadComponent: () =>
                import('./components/main-content/main-content.component').then((m) => m.MainContentComponent),
            },
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
        path: 'lessons',
        component: LessonsPageComponent, 
    },
    {
        path: '**',
        redirectTo: '',
    },
]