import { Component, OnInit, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
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
  
  selectedCard: Card | null = null;
  isPopupVisible = false;
  safeCardContent: SafeHtml | null = null;

  isViewAllMode = false;
  selectedLessonId: number | null = null;
  isAnimating = false; 

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}
  ngOnInit(): void {
    this.fetchLessons();
    if (isPlatformBrowser(this.platformId)) {
      console.log(localStorage.getItem('auth-token'));
    }
  }


  
  fetchLessons(): void {
    this.http.get<LessonsResponse>('http://localhost:8080/lesson/get-lessons').subscribe({
      next: (response) => {
        if (response.success) {
          this.lessons = response.body;
          
          const typeOrder: { [key: string]: number } = {
            'Educational': 1,
            'Test': 2,
            'Sandbox': 3
          };
          
          this.lessons.forEach(lesson => {
            lesson.cards.sort((a, b) => {
              const orderA = typeOrder[a.type] || 999;
              const orderB = typeOrder[b.type] || 999;
              return orderA - orderB;
            });
          });
          
          console.log('Lessons loaded and cards sorted:', this.lessons);
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
    if (this.isAnimating) return;
    this.fetchCardDetails(card.id);
    console.log('Card loaded:', card);
    if (card.type === 'Educational') {
      this.selectedCard = card;
      
      if (card.content) {
        this.safeCardContent = this.sanitizer.bypassSecurityTrustHtml(card.content);
      } else {
        this.safeCardContent = null;
      }
      
      this.isPopupVisible = true;
      document.body.style.overflow = 'hidden';
    }
    else if (card.type === 'Test') {
      this.selectedCard = card;
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('selectedCardId', card.id.toString());
      }
      this.router.navigate(['lessons/test']);
      document.body.style.overflow = 'hidden';
    } else if (card.type === 'Sandbox') {
      this.selectedCard = card;
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('selectedCardId', card.id.toString());
      }

      const element = document.documentElement;
      if (element.requestFullscreen) {
        element.requestFullscreen();
      }

      this.router.navigate(['lessons/sandbox-card']);
      document.body.style.overflow = 'hidden';
    }
  }

  fetchCardDetails(cardId: number): void {
    let token = null;
    if (isPlatformBrowser(this.platformId)) {
      token = localStorage.getItem('auth-token'); 
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    this.http.get<{body: Card, success: boolean, error: string}>(`http://localhost:8080/card/get-card/${cardId}`, {headers}).subscribe({
      next: (response) => {
        console.log('Card details received:', response);
        
        if (response.success && response.body) {
          this.selectedCard = response.body;
          
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
   * Returns the CSS class for styling cards based on their type
   */
  getCardTypeClass(cardType: string): string {
    switch(cardType) {
      case 'Test':
        return 'test-card';
      case 'Sandbox':
        return 'sandbox-card';
      case 'Educational':
      default:
        return 'educational-card';
    }
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
    if (this.isAnimating) return; 
    const button = event.currentTarget as HTMLButtonElement;
    const categoryContainer = button.closest('.category-container');
    if (!categoryContainer) return;
    
    const scrollContainer = categoryContainer.querySelector('.scroll-container');
    if (!scrollContainer) return;
    
    const lessonContainer = scrollContainer.querySelector('.lesson-container') as HTMLElement;
    if (!lessonContainer) return;
    
    const scrollAmount = 341; // 325px card width + 16px gap
    
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

  /**
   * Toggle View All mode for a specific lesson
   */
  toggleViewAllMode(lessonId: number): void {
    if (this.isAnimating) {
      return;
    }

    if (this.isViewAllMode && this.selectedLessonId === lessonId) {
      this.closeViewAll();
    } else if (!this.isViewAllMode) {
      this.isAnimating = true;

      const allCategoryContainers = document.querySelectorAll('.category-container');
      allCategoryContainers.forEach(container => {
        const htmlContainer = container as HTMLElement;
        htmlContainer.classList.add('animated');
        const catId = parseInt(htmlContainer.dataset['category'] || '0');
        if (catId !== lessonId) {
          htmlContainer.classList.add('category-container-fade-out');
        }
      });

      const selectedCategoryContainer = document.querySelector(`.category-container[data-category="${lessonId}"]`);
      if (selectedCategoryContainer) {
        selectedCategoryContainer.classList.add('animated');
        const scrollerCards = selectedCategoryContainer.querySelectorAll('.lesson-container .lesson-card');
        const numCards = scrollerCards.length;

        scrollerCards.forEach((card, index) => {
          const htmlCard = card as HTMLElement;
          htmlCard.classList.add('animated');

          if (numCards === 1) {
            htmlCard.classList.add('card-scroller-slide-out-far-left');
          } else if(numCards === 2) {
            if(index === 0) 
              htmlCard.classList.add('card-scroller-slide-out-far-left');
            else if(index === 1) 
              htmlCard.classList.add('card-scroller-slide-out-far-right');
          } else if(numCards === 3) {
            if(index === 0) 
              htmlCard.classList.add('card-scroller-slide-out-far-left');
            else if(index === 1) 
              htmlCard.classList.add('card-scroller-slide-out-left');
            else if(index === 2) 
              htmlCard.classList.add('card-scroller-slide-out-far-right');
          } else { 
            if (index === 0 || index === 1) { 
              htmlCard.classList.add('card-scroller-slide-out-far-left');
            } else { //index === numCards - 1 || index === numCards - 2
              htmlCard.classList.add('card-scroller-slide-out-far-right');
            } 
            /*else { 
              if ((index - 2) % 2 === 0) { 
                htmlCard.classList.add('card-scroller-slide-out-left');
              } else {
                htmlCard.classList.add('card-scroller-slide-out-right');
              }
            }*/
          }
        });
      }

      setTimeout(() => {
        this.selectedLessonId = lessonId;
        this.isViewAllMode = true;

        setTimeout(() => {
          const viewAllCards = document.querySelectorAll('.view-all-mode .lesson-card');
          viewAllCards.forEach(card => {
            card.classList.add('card-grid-fade-in');
          });
        }, 50);

      }, 300); 

      setTimeout(() => {
        this.isAnimating = false;
        document.querySelectorAll('.category-container.animated').forEach(el => el.classList.remove('category-container-fade-out', 'animated'));
        document.querySelectorAll('.lesson-card.animated').forEach(el => el.classList.remove(
            'card-scroller-slide-out-left', 
            'card-scroller-slide-out-right', 
            'card-scroller-slide-out-far-left', 
            'card-scroller-slide-out-far-right', 
            'animated'
        ));
      }, 1200);
    }
  }

  /**
   * Exit View All mode
   */
  closeViewAll(): void {
    if (this.isAnimating && this.isViewAllMode) {
    }

    if (this.isViewAllMode) { 
        this.isViewAllMode = false;
        this.selectedLessonId = null;
        this.isAnimating = false; 
    }
  }

  /**
   * Get the currently selected lesson data
   */
  getSelectedLesson(): Lesson | undefined {
    if (this.selectedLessonId === null) return undefined;
    return this.lessons.find(lesson => lesson.id === this.selectedLessonId);
  }
}
