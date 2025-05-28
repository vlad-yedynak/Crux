import { Routes } from '@angular/router';
import { LessonsPageComponent } from './pages/lessons-page/lessons-page.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { AuthPageComponent } from './auth/auth-page/auth-page.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { TestPageComponent } from './pages/test-page/test-page.component';
import { SandboxCardComponent } from './pages/sandbox-card/sandbox-card.component';
import { SandboxCardBezierComponent } from './pages/sandbox-card-bezier/sandbox-card-bezier.component';
import { SandboxCardFractalComponent } from './pages/sandbox-card-fractal/sandbox-card-fractal/sandbox-card-fractal.component';
import { SandboxCardAnimationComponent } from './pages/sandbox-card-animation/sandbox-card-animation.component';
import { SandboxCardColorsComponent } from './pages/sandbox-card-colors/sandbox-card-colors.component';
import { AdminPageComponent } from './pages/admin-page/admin-page.component';
import { ReccomendationsPageComponent } from './pages/reccomendations-page/reccomendations-page.component';
import { AboutPageComponent } from './pages/about-page/about-page.component';

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
            },
            {
                path: 'lessons/sandbox-card',
                component: SandboxCardComponent,
            },
            {
                path: 'lessons/sandbox-card-bezier',
                component: SandboxCardBezierComponent,
            },
            {
                path: 'lessons/sandbox-card-fractal',
                component: SandboxCardFractalComponent,
            },
            {
                path: 'lessons/sandbox-card-colors',
                component: SandboxCardColorsComponent,
            },
            {
                path: 'lessons/sandbox-card-animations',
                component: SandboxCardAnimationComponent,
            },
            {
                path: 'admin',
                component: AdminPageComponent,
            },
            {
                path: 'foryou',
                component: ReccomendationsPageComponent,
            },
            {
                path: 'about',
                component: AboutPageComponent,
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
        path: '**',
        redirectTo: '',
    },
]