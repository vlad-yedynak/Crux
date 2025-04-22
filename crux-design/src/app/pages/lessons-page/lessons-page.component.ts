import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../components/header/header.component';
import { NavigationComponent } from '../../components/navigation/navigation.component';

@Component({
  selector: 'app-lessons-page',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    NavigationComponent
  ],
  templateUrl: './lessons-page.component.html',
  styleUrl: './lessons-page.component.css'
})
export class LessonsPageComponent {
  /**
   * Scroll the lesson container horizontally
   */
  scrollLessons(event: MouseEvent, direction: 'left' | 'right'): void {
    const button = event.currentTarget as HTMLButtonElement;
    const scrollContainer = button.closest('.scroll-container');
    if (!scrollContainer) return;
    
    const lessonContainer = scrollContainer.querySelector('.lesson-container') as HTMLElement;
    if (!lessonContainer) return;
    
    // Scroll amount - approximately one card width plus gap
    const scrollAmount = 330; // 300px card width + 30px gap
    
    // Scroll left or right
    if (direction === 'left') {
      lessonContainer.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth'
      });
    } else {
      lessonContainer.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  }
}
