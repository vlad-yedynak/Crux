import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../components/header/header.component';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';

// Data models for API response
interface Card {
  id: number;
  title: string;
  description: string;
  lessonId: number;
  type: string;
  content: string;
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
  
  // Properties for the popup
  selectedCard: Card | null = null;
  isPopupVisible = false;
  safeCardContent: SafeHtml | null = null;


  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private router: Router
  ) {}
  ngOnInit(): void {
    this.fetchLessons();
    console.log(localStorage.getItem('auth-token'));
  }


  
  fetchLessons(): void {
    this.http.get<LessonsResponse>('http://localhost:8080/lessons/get-lessons').subscribe({
      next: (response) => {
        if (response.success) {
          this.lessons = response.body;
          console.log('Lessons loaded:', this.lessons);
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
   * Open popup for educational cards and fetch detailed card information
   */
  openCardDetails(card: Card): void {
    // First fetch detailed card data from API
    this.fetchCardDetails(card.id);

    // Check if this is an educational card type
    if (card.type === 'Educational') {
      this.selectedCard = card;
      
      // Sanitize the HTML content for safe display
      if (card.content) {
        this.safeCardContent = this.sanitizer.bypassSecurityTrustHtml(card.content);
      } else {
        this.safeCardContent = null;
      }
      
      this.isPopupVisible = true;
      // Prevent scrolling on the body when popup is open
      document.body.style.overflow = 'hidden';
    }
    else if (card.type === 'Test') {
      this.selectedCard = card;
      localStorage.setItem('selectedCardId', card.id.toString());
      this.router.navigate(['lessons/test']);
      document.body.style.overflow = 'hidden';
    }
  }

  fetchCardDetails(cardId: number): void {
    const token = localStorage.getItem('auth-token'); 
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    this.http.get<{body: Card, success: boolean, error: string}>(`http://localhost:8080/lessons/get-card/${cardId}`, {headers}).subscribe({
      next: (response) => {
        console.log('Card details received:', response);
        
        if (response.success && response.body) {
          // Update the selected card with the fetched details
          this.selectedCard = response.body;
          
          // Sanitize the HTML content for safe display
          if (this.selectedCard.content) {
            this.safeCardContent = this.sanitizer.bypassSecurityTrustHtml(this.selectedCard.content);
          } else {
            this.safeCardContent = null;
          }
        }
      },
      error: (error) => {
        console.error(`Error fetching details for card ${cardId}:`, error);
      }
    });
  }

  /**
   * Close the popup window
   */
  closePopup(event: MouseEvent): void {
    // Only close if clicking the overlay or close button
    if (
      (event.target as HTMLElement).classList.contains('card-popup-overlay') ||
      (event.target as HTMLElement).classList.contains('close-popup-btn')
    ) {
      this.isPopupVisible = false;
      this.selectedCard = null;
      this.safeCardContent = null;
      // Re-enable scrolling on the body
      document.body.style.overflow = 'auto';
    }
  }

  /**
   * Close popup when escape key is pressed
   */
  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    if (this.isPopupVisible) {
      this.isPopupVisible = false;
      this.selectedCard = null;
      this.safeCardContent = null;
      document.body.style.overflow = 'auto';
    }
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
