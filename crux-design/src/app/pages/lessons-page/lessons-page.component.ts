import { Component, OnInit, OnDestroy, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { LessonsService, Lesson, Card } from '../../services/lessons.service';
import { CookiesService } from '../../services/cookies.service';
import { ConfigService } from '../../services/config.service';
import { Subscription } from 'rxjs';
import { AuthServiceService } from '../../services/auth-service.service';
import { TimeTrackerService } from '../../services/time-tracker.service'; // Import TimeTrackerService

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
export class LessonsPageComponent implements OnInit, OnDestroy {
  lessons: Lesson[] = [];
  isLoading = true;
  
  selectedCard: Card | null = null;
  isPopupVisible = false;
  safeCardContent: SafeHtml | null = null;

  // Add properties for educational content with images and attachments
  educationalImages: { url: string; caption: string; altText: string }[] = [];
  educationalAttachments: { url: string; description: string }[] = [];

  isViewAllMode = false;
  selectedLessonId: number | null = null;
  isAnimating = false;
  
  private lessonsSubscription: Subscription | null = null;

  isAuthenticated: boolean = false;
  showAuthMessage: boolean = false;
  redirectCountdown: number = 3;

  private redirectTimer: any = null;

  // Add flag to track if the page is being loaded for the first time
  private pageRefreshed = true;

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    public router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private lessonsService: LessonsService,
    private cookiesService: CookiesService,
    private authService: AuthServiceService,
    private timeTrackerService: TimeTrackerService, // Add TimeTrackerService
    private configService: ConfigService
  ) {}

  @HostListener('window:load')
  onPageLoad(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Перевіряємо, чи це оновлення сторінки
      const isPageRefresh = this.isPageRefresh();
      
      if (isPageRefresh) {
        console.log('Сторінка була оновлена - виконуємо запит до API для отримання свіжих даних');
        this.lessonsService.forceRefreshLessons().subscribe({
          next: (refreshedLessons) => {
            console.log('Уроки оновлено з сервера:', refreshedLessons ? refreshedLessons.length : 0);
            if (refreshedLessons && refreshedLessons.length > 0) {
              this.processLessonsData(refreshedLessons);
            }
          },
          error: (err) => {
            console.error('Помилка при оновленні даних уроків:', err);
            // Навіть при помилці, спробуємо завантажити з localStorage
            this.ensureLessonsLoaded();
          }
        });
      }
    }
  }
  
  // Helper method to detect if current page load is a refresh
  private isPageRefresh(): boolean {
    // Use multiple methods to detect refresh for better browser compatibility
    
    // Method 1: Using Performance API navigation type (modern browsers)
    if (window.performance) {
      if (window.performance.getEntriesByType) {
        const navigationEntries = window.performance.getEntriesByType('navigation');
        if (navigationEntries.length > 0) {
          return (navigationEntries[0] as any).type === 'reload';
        }
      }
      
      // Method 2: Older Performance API (fallback)
      if (window.performance.navigation) {
        return window.performance.navigation.type === 1; // 1 is TYPE_RELOAD
      }
    }
    
    // If we can't detect it reliably, default to false
    return false;
  }

  ngOnInit(): void {
    // Підписка на зміни даних про уроки
    this.lessonsSubscription = this.lessonsService.getLessons().subscribe(lessons => {
      if (lessons && lessons.length > 0) {
        console.log('Lessons state updated:', lessons.length, 'lessons available');
        this.processLessonsData(lessons);
      }
    });
    
    // Перевіряємо і завантажуємо уроки (з localStorage або з сервера)
    if (isPlatformBrowser(this.platformId)) {
      this.ensureLessonsLoaded();
    }
  }
  
  ngOnDestroy(): void {
    if (this.lessonsSubscription) {
      this.lessonsSubscription.unsubscribe();
      this.lessonsSubscription = null;
    }
    
    // Clear any running timers when component is destroyed
    this.clearRedirectTimer();
  }
  
  processLessonsData(lessonsInfo: any[]): void {
    try {
      this.lessons = lessonsInfo as Lesson[];
      
      const typeOrder: { [key: string]: number } = {
        'Educational': 1,
        'Test': 2,
        'Sandbox': 3
      };
      
      this.lessons.forEach(lesson => {
        if (lesson.cards && Array.isArray(lesson.cards)) {
          lesson.cards.sort((a, b) => {
            const orderA = typeOrder[a.type] || 999;
            const orderB = typeOrder[b.type] || 999;
            return orderA - orderB;
          });
        } else {
          lesson.cards = []; 
        }
      });
      
      console.log('Lessons loaded and cards sorted:', this.lessons);
      this.isLoading = false;
    } catch (error) {
      console.error('Error processing lessons data:', error);
      this.isLoading = false;
    }
  }

  openCardDetails(card: Card): void {
    if (this.isAnimating) return;
    
    console.log('Card selected for details/navigation:', card); 
    if (card.type === 'Educational') {
      
      this.isAuthenticated = this.authService.isLoggedIn();
      
      if (!this.isAuthenticated) {
        this.showAuthMessage = true;
        this.startRedirectCountdown();
        return; 
      }
      
      // Always force refresh from server for educational cards
      this.fetchCardDetailsFromServer(card.id);
      this.isPopupVisible = true;
      document.body.style.overflow = 'hidden';
      
      // Start time tracking for educational card
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('selectedCardId', card.id.toString());
        localStorage.setItem('selectedLessonId', card.lessonId.toString());
        this.timeTrackerService.startTracking(card.id, card.lessonId);
      }
    }
    else if (card.type === 'Test') {
      this.isAuthenticated = this.authService.isLoggedIn();
      
      if (!this.isAuthenticated) {
        this.showAuthMessage = true;
        this.startRedirectCountdown();
        return; 
      }
      
      // Save card and lesson IDs for the test page
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('selectedCardId', card.id.toString());
        localStorage.setItem('selectedLessonId', card.lessonId.toString());
      }
      
      this.router.navigate(['lessons/test']);
      document.body.style.overflow = 'hidden'; 
    } else if (card.type === 'Sandbox') {
      this.isAuthenticated = this.authService.isLoggedIn();
      
      if (!this.isAuthenticated) {
        this.showAuthMessage = true;
        this.startRedirectCountdown();
        return; 
      }
      
      // Fetch full card details before navigation
      this.lessonsService.getCardById(card.id).subscribe({
        next: (cardData) => {
          if (cardData) {
            console.log('Full sandbox card details fetched:', cardData);
            
            // Save card and lesson IDs for the sandbox page
            if (isPlatformBrowser(this.platformId)) {
              localStorage.setItem('selectedCardId', card.id.toString());
              localStorage.setItem('selectedLessonId', card.lessonId.toString());
            }

            const element = document.documentElement;
            if (element.requestFullscreen) {
              element.requestFullscreen();
            }

            // Check sandboxType and route accordingly
            if (cardData.sandboxType === 'Bezier') {
              this.router.navigate(['lessons/sandbox-card-bezier']);
            } else if (cardData.sandboxType === 'FractalSystem') {
              this.router.navigate(['lessons/sandbox-card-fractal']);
            }  else if (cardData.sandboxType === 'Animation') {
              this.router.navigate(['lessons/sandbox-card-animations']);
            } else if (cardData.sandboxType === 'ColorSystem' || cardData.sandboxType === 'Colors') {
              this.router.navigate(['lessons/sandbox-card-colors']);
            } else {
              this.router.navigate(['lessons/sandbox-card']);
            }
            
            document.body.style.overflow = 'hidden';
          } else {
            console.error(`LessonsPageComponent: Failed to fetch full details for sandbox card ${card.id}.`);
          }
        },
        error: (error) => {
          console.error(`LessonsPageComponent: Error fetching sandbox card ${card.id} details:`, error);
          
          // If authentication error, show auth message
          if (error.status === 401 || error.status === 403) {
            this.showAuthMessage = true;
            this.startRedirectCountdown();
          }
        }
      });
    }
  }
  
  // New method to always fetch card from server
  fetchCardDetailsFromServer(cardId: number): void {
    console.log(`LessonsPageComponent: Forcing server request for card ${cardId}`);
    this.lessonsService.forceRefreshCardById(cardId).subscribe({
      next: (cardData) => {
        if (cardData) {
          console.log('Card details received from server in LessonsPageComponent:', cardData);
          this.selectedCard = cardData;
          
          // Clear previous images and attachments
          this.educationalImages = [];
          this.educationalAttachments = [];
          
          if (this.selectedCard.content) {
            let contentValue: string = '';
            let parsedContent: any = null;
            
            // Parse content and extract images/attachments
            try {
              if (typeof this.selectedCard.content === 'string') {
                try {
                  parsedContent = JSON.parse(this.selectedCard.content);
                  contentValue = parsedContent.content || '';
                } catch {
                  // If it's not valid JSON, use as-is (might be direct HTML)
                  contentValue = this.selectedCard.content;
                }
              } else if (typeof this.selectedCard.content === 'object' && this.selectedCard.content !== null) {
                if ('content' in this.selectedCard.content) {
                  parsedContent = this.selectedCard.content;
                  contentValue = (this.selectedCard.content as { content?: string }).content || '';
                } else {
                  // Convert object to string safely
                  contentValue = JSON.stringify(this.selectedCard.content);
                }
              }
              
              // Extract images and attachments if they exist
              if (parsedContent) {
                if (parsedContent.images && Array.isArray(parsedContent.images)) {
                  this.educationalImages = parsedContent.images.map((img: any) => ({
                    url: img.url || '',
                    caption: img.caption || '',
                    altText: img.altText || ''
                  }));
                }
                
                if (parsedContent.attachments && Array.isArray(parsedContent.attachments)) {
                  this.educationalAttachments = parsedContent.attachments.map((att: any) => ({
                    url: att.url || '',
                    description: att.description || ''
                  }));
                }
              }
            } catch (error) {
              console.error('Error parsing educational content:', error);
              contentValue = this.selectedCard.content as string;
            }
            
            this.safeCardContent = this.sanitizer.bypassSecurityTrustHtml(contentValue);
          } else {
            this.safeCardContent = null;
            console.warn(`LessonsPageComponent: Card ${cardId} has no content.`);
          }
        } else {
          console.error(`LessonsPageComponent: Failed to fetch details for card ${cardId} from service.`);
          this.closePopup(new MouseEvent('click'));
        }
      },
      error: (error) => {
        console.error(`LessonsPageComponent: Error fetching details for card ${cardId}:`, error);
        this.closePopup(new MouseEvent('click'));
        
        // If authentication error, show auth message
        if (error.status === 401 || error.status === 403) {
          this.showAuthMessage = true;
          this.startRedirectCountdown();
        }
      }
    });
  }

  startRedirectCountdown(): void {
    this.clearRedirectTimer();
    
    this.redirectTimer = setInterval(() => {
      this.redirectCountdown--;
      if (this.redirectCountdown <= 0) {
        this.clearRedirectTimer();
        this.router.navigate(['/auth']);
      }
    }, 1000);
  }
  
  clearRedirectTimer(): void {
    if (this.redirectTimer) {
      clearInterval(this.redirectTimer);
      this.redirectTimer = null;
      this.redirectCountdown = 3; 
    }
  }

  closeAuthMessage(): void {
    this.clearRedirectTimer();
    this.showAuthMessage = false;
  }  // Helper method to get full URL for images and attachments
  getFullUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) {
      return url;
    }
    // Add API base URL for relative paths
    return `${this.configService.apiUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  // Helper method to check if attachment is downloadable
  isDownloadableAttachment(url: string): boolean {
    if (!url) return false;
    const downloadableExtensions = ['.pdf', '.doc', '.docx', '.txt', '.zip', '.rar'];
    return downloadableExtensions.some(ext => url.toLowerCase().includes(ext));
  }

  fetchCardDetails(cardId: number): void {
    this.lessonsService.getCardById(cardId).subscribe({
      next: (cardData) => {
        if (cardData) {
          console.log('Card details received in LessonsPageComponent:', cardData);
          this.selectedCard = cardData;
          
          // Clear previous images and attachments
          this.educationalImages = [];
          this.educationalAttachments = [];
          
          if (this.selectedCard.content) {
            let contentValue: string = '';
            let parsedContent: any = null;
            
            // Parse content and extract images/attachments
            try {
              if (typeof this.selectedCard.content === 'string') {
                try {
                  parsedContent = JSON.parse(this.selectedCard.content);
                  contentValue = parsedContent.content || '';
                } catch {
                  // If it's not valid JSON, use as-is (might be direct HTML)
                  contentValue = this.selectedCard.content;
                }              } else if (typeof this.selectedCard.content === 'object' && this.selectedCard.content !== null) {
                if ('content' in this.selectedCard.content) {
                  parsedContent = this.selectedCard.content;
                  contentValue = (this.selectedCard.content as { content?: string }).content || '';
                } else {
                  // Convert object to string safely
                  contentValue = JSON.stringify(this.selectedCard.content);
                }
              }
              
              // Extract images and attachments if they exist
              if (parsedContent) {
                if (parsedContent.images && Array.isArray(parsedContent.images)) {
                  this.educationalImages = parsedContent.images.map((img: any) => ({
                    url: img.url || '',
                    caption: img.caption || '',
                    altText: img.altText || ''
                  }));
                }
                
                if (parsedContent.attachments && Array.isArray(parsedContent.attachments)) {
                  this.educationalAttachments = parsedContent.attachments.map((att: any) => ({
                    url: att.url || '',
                    description: att.description || ''
                  }));
                }
              }
            } catch (error) {
              console.error('Error parsing educational content:', error);
              contentValue = this.selectedCard.content as string;
            }
            
            this.safeCardContent = this.sanitizer.bypassSecurityTrustHtml(contentValue);
          } else {
            this.safeCardContent = null;
            console.warn(`LessonsPageComponent: Card ${cardId} has no content.`);
          }
        } else {
          console.error(`LessonsPageComponent: Failed to fetch details for card ${cardId} from service.`);
          this.closePopup(new MouseEvent('click'));
        }
      },
      error: (error) => {
        console.error(`LessonsPageComponent: Error fetching details for card ${cardId}:`, error);
        this.closePopup(new MouseEvent('click'));
        
        // If authentication error, show auth message
        if (error.status === 401 || error.status === 403) {
          this.showAuthMessage = true;
          this.startRedirectCountdown();
        }
      }
    });
  }

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

  closePopup(event: MouseEvent): void {
    if (
      (event.target as HTMLElement).classList.contains('card-popup-overlay') ||
      (event.target as HTMLElement).classList.contains('close-popup-btn')
    ) {
      // Stop time tracking when closing educational card popup
      if (this.isPopupVisible && this.selectedCard?.type === 'Educational') {
        this.timeTrackerService.stopTracking();
        
        // Clear selected card and lesson from localStorage
        if (isPlatformBrowser(this.platformId)) {
          localStorage.removeItem('selectedCardId');
          localStorage.removeItem('selectedLessonId');
          
          // Also clear the card data from localStorage
          if (this.selectedCard) {
            const cardStorageKey = `app-card-detail-${this.selectedCard.id}`;
            localStorage.removeItem(cardStorageKey);
            console.log(`Removed educational card ${this.selectedCard.id} data from localStorage`);
          }
        }
      }
      
      this.isPopupVisible = false;
      this.selectedCard = null;
      this.safeCardContent = null;
      document.body.style.overflow = 'auto';
    }

    this.clearRedirectTimer();
  }

  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    if (this.isPopupVisible) {
      // Stop time tracking when closing educational card popup with escape key
      if (this.selectedCard?.type === 'Educational') {
        this.timeTrackerService.stopTracking();
        
        // Clear selected card and lesson from localStorage
        if (isPlatformBrowser(this.platformId)) {
          localStorage.removeItem('selectedCardId');
          localStorage.removeItem('selectedLessonId');
          
          // Also clear the card data from localStorage
          if (this.selectedCard) {
            const cardStorageKey = `app-card-detail-${this.selectedCard.id}`;
            localStorage.removeItem(cardStorageKey);
            console.log(`Removed educational card ${this.selectedCard.id} data from localStorage`);
          }
        }
      }
      
      this.isPopupVisible = false;
      this.selectedCard = null;
      this.safeCardContent = null;
      document.body.style.overflow = 'auto';
    }

    this.clearRedirectTimer();
  }

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

  closeViewAll(): void {
    if (this.isViewAllMode) { 
        this.isViewAllMode = false;
        this.selectedLessonId = null;
        this.isAnimating = false; 
    }
  }

  getSelectedLesson(): Lesson | undefined {
    if (this.selectedLessonId === null) return undefined;
    return this.lessons.find(lesson => lesson.id === this.selectedLessonId);
  }

  // Метод для перевірки і завантаження уроків
  private ensureLessonsLoaded(): void {
    this.lessonsService.initializeData().subscribe({
      next: (lessons) => {
        if (lessons && lessons.length > 0) {
          console.log('Успішно завантажено уроки з localStorage, кількість:', lessons.length);
        } else {
          console.log('Уроки не знайдено в localStorage або дані порожні. Виконуємо запит до сервера...');
          
          // Робимо запит до сервера, якщо немає даних в localStorage
          this.lessonsService.fetchAndSetLessons().subscribe({
            next: (fetchedLessons) => {
              if (fetchedLessons && fetchedLessons.length > 0) {
                console.log('Успішно завантажено уроки з сервера, кількість:', fetchedLessons.length);
              } else {
                console.warn('Не вдалося отримати уроки з сервера або список порожній');
                this.isLoading = false;
              }
            },
            error: (fetchError) => {
              console.error('Помилка при завантаженні уроків з сервера:', fetchError);
              this.isLoading = false;
            }
          });
        }
      },
      error: (err) => {
        console.error('Помилка при завантаженні з localStorage:', err);
        
        // При помилці читання з localStorage також спробуємо запит до сервера
        console.log('Спроба отримати дані з сервера після помилки localStorage...');
        this.lessonsService.fetchAndSetLessons().subscribe({
          next: (fetchedLessons) => {
            if (fetchedLessons && fetchedLessons.length > 0) {
              console.log('Успішно завантажено уроки з сервера після помилки, кількість:', fetchedLessons.length);
            } else {
              console.warn('Не вдалося отримати уроки з сервера або список порожній');
              this.isLoading = false;
            }
          },
          error: (fetchError) => {
            console.error('Помилка при завантаженні уроків з сервера:', fetchError);
            this.isLoading = false;
          }
        });
      }
    });
  }
}
