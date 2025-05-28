import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LessonsService, Card, Question, Answer } from '../../services/lessons.service'; // Import all needed interfaces
import { CookiesService } from '../../services/cookies.service';
import { AuthServiceService } from '../../services/auth-service.service';
import { TimeTrackerService } from '../../services/time-tracker.service'; // Import TimeTrackerService
import { ConfigService } from '../../services/config.service'; // Added import

// Answer submission format
interface AnswerSubmission {
  questionId: number;
  answerId: number;
}

interface ValidationResponse {
  body: boolean;     // true if answer is correct, false otherwise
  success: boolean;  // true if validation request succeeded
  error: string | null; // error message if any
}

@Component({
  selector: 'app-test-page',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule
  ],
  templateUrl: './test-page.component.html',
  styleUrl: './test-page.component.css'
})
export class TestPageComponent implements OnInit, OnDestroy {
  card: Card | null = null;
  isLoading = true;
  hasError = false;
  errorMessage = '';

  questions: Question[] = [];
  userAnswers: AnswerSubmission[] = [];
  questionResults: {[questionId: number]: boolean} = {};
  testSubmitted = false; 
  correctAnswersCount = 0;

  showResultsPopup = false;
  allQuestionsProcessed = false;

  isAuthenticated: boolean = false;
  showAuthMessage: boolean = false;
  redirectCountdown: number = 3;
  private redirectTimer: any = null;

  selectedAnswerIds: { [questionId: number]: number | null } = {};

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    public router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private lessonsService: LessonsService,
    private cookiesService: CookiesService,
    private authService: AuthServiceService,
    private timeTrackerService: TimeTrackerService,
    private configService: ConfigService // Injected ConfigService
  ) {}

  @HostListener('window:load')
  onPageLoad(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Check if this is a page refresh
      const isPageRefresh = this.isPageRefresh();
      
      if (isPageRefresh) {
        const cardId = localStorage.getItem('selectedCardId');
        if (cardId) {
          console.log('Page was refreshed - forcing card data update from server');
          this.forceRefreshCardData(parseInt(cardId, 10));
        }
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

  // New method to force refresh card data from server
  private forceRefreshCardData(cardId: number): void {
    this.isLoading = true;
    console.log(`TestPageComponent: Forcing refresh for card ${cardId} from server`);
    
    this.lessonsService.forceRefreshCardById(cardId).subscribe({
      next: (cardData) => {
        if (cardData) {
          console.log('Card details refreshed from server in TestPageComponent:', cardData);
          this.card = cardData;
          
          if (this.card.questions && Array.isArray(this.card.questions)) {
            this.questions = this.card.questions.filter(q => q.id != null) as Question[];
            
            const newSelectedAnswerIds: { [questionId: number]: number | null } = {};
            this.questions.forEach(q => {
              newSelectedAnswerIds[q.id!] = null; 
            });
            this.selectedAnswerIds = newSelectedAnswerIds;
            this.userAnswers = []; 
            this.testSubmitted = false; // Reset submission state
          } else {
            this.questions = [];
            this.selectedAnswerIds = {};
            console.log('No questions array found in card.questions or it was null.');
          }

          if (cardData.lessonId) {
            localStorage.setItem('selectedLessonId', cardData.lessonId.toString());
          }
        } else {
          this.hasError = true;
          this.errorMessage = `Не вдалося завантажити деталі картки для ID ${cardId}`;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error(`TestPageComponent: Error refreshing details for card ${cardId}:`, error);
        this.hasError = true;
        this.errorMessage = 'Не вдалося підключитися до сервера для отримання деталей картки.';
        this.isLoading = false;
        
        // Try to load from cache as fallback
        this.loadTestData();
      }
    });
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.isAuthenticated = this.authService.isLoggedIn();
        
        if (!this.isAuthenticated) {
          this.showAuthMessage = true;
          this.startRedirectCountdown();
          return; 
        }
        this.loadTestData();
        // Start time tracking
        const cardId = localStorage.getItem('selectedCardId');
        const lessonId = localStorage.getItem('selectedLessonId');
        if (cardId && lessonId) {
          this.timeTrackerService.startTracking(parseInt(cardId, 10), parseInt(lessonId, 10));
        }
      }, 100); 
    } else {
      this.isLoading = false;
    }
  }

  ngOnDestroy(): void {
    this.clearRedirectTimer();
    // Stop time tracking
    this.timeTrackerService.stopTracking();
    
    // Clear selected card and lesson from localStorage
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('selectedCardId');
      localStorage.removeItem('selectedLessonId');
    }
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

  private loadTestData(): void {
    this.lessonsService.ensureDataLoaded(false).subscribe({
      next: () => {
        const cardId = localStorage.getItem('selectedCardId');
        
        if (cardId) {
          this.fetchCardDetails(parseInt(cardId, 10));
        } else {
          this.hasError = true;
          this.errorMessage = 'No card information available';
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Error ensuring lessons data is loaded:', err);
        const cardId = localStorage.getItem('selectedCardId');
        
        if (cardId) {
          this.fetchCardDetails(parseInt(cardId, 10));
        } else {
          this.hasError = true;
          this.errorMessage = 'No card information available';
          this.isLoading = false;
        }
      }
    });
  }

  fetchCardDetails(cardId: number): void {
    this.isLoading = true;
    this.lessonsService.getCardById(cardId).subscribe({
      next: (cardData) => {
        if (cardData) {
          console.log('Card details received in TestPageComponent:', cardData);
          this.card = cardData; 
          
          
          if (this.card.questions && Array.isArray(this.card.questions)) {
            this.questions = this.card.questions.filter(q => q.id != null) as Question[];
            
            const newSelectedAnswerIds: { [questionId: number]: number | null } = {};
            this.questions.forEach(q => {
              newSelectedAnswerIds[q.id!] = null; 
            });
            this.selectedAnswerIds = newSelectedAnswerIds;
            this.userAnswers = []; 
            this.testSubmitted = false; // Reset submission state
          } else {
            this.questions = [];
            this.selectedAnswerIds = {};
            console.log('No questions array found in card.questions or it was null.');
          }

          if (cardData.lessonId) {
            localStorage.setItem('selectedLessonId', cardData.lessonId.toString());
            // Removed time tracking code
          }
        } else {
          this.hasError = true;
          this.errorMessage = `Не вдалося завантажити деталі картки для ID ${cardId}`;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error(`TestPageComponent: Error fetching details for card ${cardId}:`, error);
        this.hasError = true;
        this.errorMessage = 'Не вдалося підключитися до сервера для отримання деталей картки.';
        this.isLoading = false;
      }
    });
  }

  selectAnswer(questionId: number | undefined, answerId: number | undefined): void {
    if (questionId === undefined || answerId === undefined) {
      console.error('Question ID or Answer ID is undefined');
      return;
    }
    
    this.selectedAnswerIds[questionId] = answerId;

    const existingIndex = this.userAnswers.findIndex(a => a.questionId === questionId);
    if (existingIndex !== -1) {
      this.userAnswers[existingIndex].answerId = answerId;
    } else {
      this.userAnswers.push({ questionId, answerId });
    }
  }
  
  hasAllAnswers(): boolean {
    if (!this.questions || this.questions.length === 0) {
      return false;
    }return this.questions.every(q => 
      q.id !== undefined && this.userAnswers.some(ua => ua.questionId === q.id)
    );
  }
  
  submitTest(): void {
    if (!this.hasAllAnswers()) {
      alert('Будь ласка, дайте відповідь на всі питання перед завершенням тесту.');
      return;
    }
    
    this.testSubmitted = true; 
    
    this.showResultsPopup = false;
    this.allQuestionsProcessed = false;
    this.correctAnswersCount = 0;
    this.questionResults = {}; // Clear previous results
    
    let tokenString: string | null = null;
    if (isPlatformBrowser(this.platformId)) {
      tokenString = this.cookiesService.getCookie('auth-token'); 
    }
    
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (tokenString) {
      headers = headers.set('Authorization', `Bearer ${tokenString}`);
    } else {
      console.warn('Auth token not found for submitTest.');
    }
    
    let processedCount = 0;
    if (this.userAnswers.length === 0 && this.questions.length > 0) {
        this.allQuestionsProcessed = true;
        this.showResultsPopup = true;
        return;
    }
    if (this.userAnswers.length === 0 && this.questions.length === 0) {
        this.allQuestionsProcessed = true;
        this.showResultsPopup = true;
        return;
    }
    
    this.userAnswers.forEach(answer => {
      this.http.post<ValidationResponse>(this.configService.getEndpoint('/test/validate-question'), answer, {headers})
        .subscribe({
          next: (result) => {
            if (result.success) {
              this.questionResults[answer.questionId] = result.body;
              if (result.body) {
                this.correctAnswersCount++;
              }
            } else {
              this.questionResults[answer.questionId] = false;
              console.error(`Validation failed for question ${answer.questionId}: ${result.error}`);
            }
            processedCount++;
            if (processedCount === this.userAnswers.length) {
              // All questions processed, now refresh data
              this.authService.forceRefreshUserData().subscribe({
                next: (user) => console.log('User data refreshed after test submission.', user),
                error: (err) => console.error('Error refreshing user data after test:', err)
              });

              if (this.card && this.card.id) {
                this.lessonsService.forceRefreshCardById(this.card.id).subscribe({
                  next: (refreshedCard) => {
                    if (refreshedCard) {
                      this.card = refreshedCard; 
                      console.log('Card data refreshed after test submission.');
                    } else {
                      console.warn('Failed to refresh card data after test submission.');
                    }
                    this.allQuestionsProcessed = true;
                    this.showResultsPopup = true;
                  },
                  error: (refreshError) => {
                    console.error('Error refreshing card data after test submission:', refreshError);
                    this.allQuestionsProcessed = true;
                    this.showResultsPopup = true; 
                  }
                });
              } else {
                console.warn('Card ID not available, cannot refresh card data. Showing popup directly.');
                this.allQuestionsProcessed = true;
                this.showResultsPopup = true;
              }
            }
          },
          error: (error) => {
            console.error(`Error validating answer for question ${answer.questionId}:`, error);
            this.questionResults[answer.questionId] = false;
            processedCount++;
            if (processedCount === this.userAnswers.length) {
              // Also refresh data in case of error for the last question
              this.authService.forceRefreshUserData().subscribe({
                next: (user) => console.log('User data refreshed after test submission (with errors).', user),
                error: (err) => console.error('Error refreshing user data after test (with errors):', err)
              });

              if (this.card && this.card.id) {
                this.lessonsService.forceRefreshCardById(this.card.id).subscribe({
                  next: (refreshedCard) => {
                     if (refreshedCard) {
                      this.card = refreshedCard;
                      console.log('Card data refreshed after test submission (with errors).');
                    } else {
                       console.warn('Failed to refresh card data after test submission (with errors).');
                    }
                    this.allQuestionsProcessed = true;
                    this.showResultsPopup = true;
                  },
                  error: (refreshError) => {
                    console.error('Error refreshing card data after test submission (with errors):', refreshError);
                    this.allQuestionsProcessed = true;
                    this.showResultsPopup = true;
                  }
                });
              } else {
                 console.warn('Card ID not available, cannot refresh card data. Showing popup directly (with errors).');
                this.allQuestionsProcessed = true;
                this.showResultsPopup = true;
              }
            }
          }
        });
    });
  }
  
  restartTest(): void {
    this.testSubmitted = false;
    this.userAnswers = [];
    this.questionResults = {};
    this.correctAnswersCount = 0;
    this.showResultsPopup = false;
    
    const newSelectedAnswerIds: { [questionId: number]: number | null } = {};
    this.questions.forEach(q => {
      if (q.id != null) {
        newSelectedAnswerIds[q.id] = null;
      }
    });
    this.selectedAnswerIds = newSelectedAnswerIds;
    
    const cardId = localStorage.getItem('selectedCardId');
    if (cardId) {
      this.fetchCardDetails(parseInt(cardId, 10));
    }
  }
  
  returnToLessons(): void {
    // Stop time tracking before navigating away
    this.timeTrackerService.stopTracking();
    
    // Clear selected card and lesson from localStorage
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('selectedCardId');
      localStorage.removeItem('selectedLessonId');
    }
    
    this.router.navigate(['/lessons']);
  }
  
  closeResultsPopup(): void {
    this.showResultsPopup = false;
  }
}
