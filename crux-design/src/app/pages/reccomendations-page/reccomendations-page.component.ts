import { Component, OnInit, HostListener, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { CookiesService } from '../../services/cookies.service';
import { ConfigService } from '../../services/config.service';

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
  styleUrl: './reccomendations-page.component.css'
})
export class ReccomendationsPageComponent implements OnInit, OnDestroy {
  private readonly AUTH_TOKEN_KEY = 'auth-token';
  
  recommendations: RecommendationItem[] = [];
  isLoading = true;
  hasError = false;
  errorMessage = '';
  noRecommendationsMessage = 'Неможливо отримати рекомендації. Спочатку завершіть кілька уроків.';

  constructor(
    private router: Router,
    private http: HttpClient,
    private cookiesService: CookiesService,
    private configService: ConfigService,
  ) {}

  ngOnInit(): void {
    this.loadRecommendations();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  private loadRecommendations(): void {
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
  }
}
