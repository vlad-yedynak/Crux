import { Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { MainContentComponent } from './components/main-content/main-content.component';
import { LessonsPageComponent } from './pages/lessons-page/lessons-page.component';

export const routes: Routes = [
    {
        path: '',
        component: MainContentComponent, // головна сторінка
    },
    {
        path: 'lessons',
        component: LessonsPageComponent, // інша сторінка
    }
]