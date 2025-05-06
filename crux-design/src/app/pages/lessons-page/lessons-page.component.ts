import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../components/header/header.component';
import { HttpClient, HttpClientModule } from '@angular/common/http';

// Data models for API response
interface Card {
  id: number;
  title: string;
  description: string;
  lessonId: number;
  type: number;
}

interface Lesson {
  id: number;
  title: string;
  cards: Card[];
}

interface LessonsResponse {
  body: Lesson[];
  success: boolean;
  error: string;
}

@Component({
  selector: 'app-lessons-page',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    HttpClientModule
  ],
  templateUrl: './lessons-page.component.html',
  styleUrl: './lessons-page.component.css'
})
export class LessonsPageComponent implements OnInit {
  lessons: Lesson[] = [];
  isLoading = true;
  hasError = false;
  errorMessage = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchLessons();
  }

  fetchLessons(): void {
    this.http.get<LessonsResponse>('http://localhost:8080/lessons/get-lessons').subscribe({
      next: (response) => {
        if (response.success) {
          this.lessons = response.body;
        } else {
          this.hasError = true;
          this.errorMessage = response.error || 'Failed to load lessons';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching lessons:', error);
        this.hasError = true;
        this.errorMessage = 'Failed to connect to the server';
        this.isLoading = false;
      }
    });
  }

  /**
   * Scroll the lesson container horizontally
   */
  scrollLessons(event: MouseEvent, direction: 'left' | 'right'): void {
    const button = event.currentTarget as HTMLButtonElement;
    // First find the parent category container
    const categoryContainer = button.closest('.category-container');
    if (!categoryContainer) return;
    
    // Then find the scroll container within this category
    const scrollContainer = categoryContainer.querySelector('.scroll-container');
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
