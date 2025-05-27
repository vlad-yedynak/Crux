import { Component, OnInit, HostListener, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { CookiesService } from '../../services/cookies.service';
import { ConfigService } from '../../services/config.service';
import { TimeTrackerService } from '../../services/time-tracker.service';
import { trigger, state, style, transition, animate } from '@angular/animations';

// Interface definitions for recommendations
interface RecommendationItem {
  title: string;
  url: string;
  thumbnail: string;
  message: string;
  success: boolean;
  error?: string;
}

interface RecommendationsResponse {
  success: boolean;
  body: RecommendationItem[] | null;
  error?: string;
}

@Component({
  selector: 'app-reccomendations-page',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './reccomendations-page.component.html',
  styleUrl: './reccomendations-page.component.css',
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateY(-100%)', opacity: 0 }),
        animate('300ms ease-in', style({ transform: 'translateY(0%)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ transform: 'translateY(-100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class ReccomendationsPageComponent implements OnInit, OnDestroy {
  private readonly AUTH_TOKEN_KEY = 'auth-token';
  
  recommendations: RecommendationItem[] = [];
  isLoading = true;
  isResetting = false;
  hasError = false;
  errorMessage = '';
  noRecommendationsMessage = 'Неможливо отримати рекомендації. Спочатку завершіть кілька уроків.';
    // Notification system properties
  showNotification = false;
  notificationMessage = '';
  notificationType: 'success' | 'error' | 'warning' | 'info' = 'info';
  notificationTimeout: any;
  
  // Confirmation dialog properties
  showConfirmDialog = false;
  confirmDialogMessage = '';
  confirmDialogTitle = '';
  pendingAction: () => void = () => {};
  constructor(
    private router: Router,
    private http: HttpClient,
    private cookiesService: CookiesService,
    private configService: ConfigService,
    private timeTrackerService: TimeTrackerService
  ) {}

  ngOnInit(): void {
    this.loadRecommendations();
  }
  ngOnDestroy(): void {
    // Cleanup notification timeout
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
  }

  // Notification system methods
  private showToastNotification(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration: number = 4000): void {
    this.notificationMessage = message;
    this.notificationType = type;
    this.showNotification = true;

    // Clear existing timeout
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }

    // Auto-hide notification after duration
    this.notificationTimeout = setTimeout(() => {
      this.hideNotification();
    }, duration);
  }
  hideNotification(): void {
    this.showNotification = false;
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
      this.notificationTimeout = null;
    }
  }

  // Confirmation dialog methods
  private showConfirmationDialog(title: string, message: string, action: () => void): void {
    this.confirmDialogTitle = title;
    this.confirmDialogMessage = message;
    this.pendingAction = action;
    this.showConfirmDialog = true;
  }

  onConfirmAction(): void {
    this.showConfirmDialog = false;
    this.pendingAction();
  }

  onCancelAction(): void {
    this.showConfirmDialog = false;
    this.pendingAction = () => {};
  }

  loadRecommendations(): void {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    const token = this.cookiesService.getCookie(this.AUTH_TOKEN_KEY);
    if (!token) {
      this.handleError('Потрібна автентифікація. Будь ласка, увійдіть, щоб переглянути рекомендації.');
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.get<RecommendationsResponse>(`${this.configService.apiUrl}/personalization/feed`, { headers })
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          
          if (response && response.success) {
            if (response.body && response.body.length > 0) {
              this.recommendations = response.body;
              console.log('Recommendations loaded successfully:', this.recommendations);
            } else {
              // No recommendations available - show default message
              this.recommendations = [];
              console.log('No recommendations available');
            }          } else {
            this.handleError(response?.error || 'Не вдалося завантажити рекомендації');
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error loading recommendations:', error);
            if (error.status === 401 || error.status === 403) {
            this.handleError('Помилка автентифікації. Будь ласка, увійдіть знову.');
            // Optionally redirect to login
            // this.router.navigate(['/auth']);
          } else {
            this.handleError('Не вдалося завантажити рекомендації. Спробуйте пізніше.');
          }
        }
      });
  }

  private handleError(message: string): void {
    this.isLoading = false;
    this.hasError = true;
    this.errorMessage = message;
    this.recommendations = [];
  }
  onRecommendationClick(recommendation: RecommendationItem): void {
    if (recommendation.url) {
      // Open the recommendation URL (could be external or internal)
      if (recommendation.url.startsWith('http')) {
        // External URL - open in new tab
        window.open(recommendation.url, '_blank');
      } else {
        // Internal route - navigate within the app
        this.router.navigate([recommendation.url]);
      }
    }
  }

  // Track by function for ngFor performance
  trackByTitle(index: number, item: RecommendationItem): string {
    return item.title + item.url;
  }

  // Handle image loading errors
  onImageError(event: any): void {
    event.target.style.display = 'none';
    // Could also set a default image here
  }  clearTrackingData(): void {
    if (this.isResetting || this.isLoading) return;

    this.showConfirmationDialog(
      'Підтвердження очищення даних',
      'Ви впевнені, що хочете очистити всі дані відстеження часу? Це очистить вашу історію навчання і може змінити рекомендації.',
      () => this.performDataClear()
    );
  }

  private performDataClear(): void {
    this.isResetting = true;
    this.hasError = false;
    this.errorMessage = '';

    this.timeTrackerService.resetAllTimeData()
      .then(() => {
        this.isResetting = false;
        // Reload recommendations after clearing data
        this.loadRecommendations();
        this.showToastNotification('Дані успішно очищено! Рекомендації будуть оновлені на основі нових даних.', 'success', 5000);
      })
      .catch((error) => {
        this.isResetting = false;
        console.error('Error clearing tracking data:', error);
        this.handleError('Не вдалося очистити дані. Спробуйте пізніше.');
        this.showToastNotification('Помилка при очищенні даних. Спробуйте пізніше.', 'error');
      });
  }
}
