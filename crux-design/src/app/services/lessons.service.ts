import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { CookiesService } from './cookies.service';

export interface Answer {
  id: number;
  answerText: string; 
}

export interface Question {
  id?: number; 
  questionText?: string;
  answers: Answer[];
}

export interface Task {
  id: number;
  name: string;
  description: string;
  points: number;
  isCompleted: boolean;
  expectedDataType?: string[]; 
  expectedDataCount?: number;
}

export interface Card {
  id: number;
  title: string;
  description: string;
  lessonId: number;
  type: string; // "Educational", "Test", "Sandbox"
  content: string | null;
  questions?: Question[] | null; 
  tasks?: Task[] | null;         
  sandboxType?: string | null;   
}

export interface Lesson {
  id: number;
  title: string;
  cards: Card[];
  totalPoints: number;
}

// Старий код, лінь переписувати нехай працює
export interface LessonGeneralInfo {
  id: number;
  title: string;
  totalPoints: number;
}

export interface LessonsResponse {
  body: Lesson[]; 
  success: boolean;
  error: string;
}

interface ApiResponseCardBody {
  content: string | null;
  questions: any[] | null; 
  tasks: any[] | null;    
  sandboxType?: string;
  id: number;
  title: string;
  description: string;
  lessonId: number;
  type: string;
}

export interface CardApiResponse {
  body: ApiResponseCardBody; 
  success: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class LessonsService {

  private lessonsSubject = new BehaviorSubject<Lesson[] | null>(null);
  private baseUrl = 'http://crux-api-1:8080/lesson'; 
  private cardBaseUrl = 'http://crux-api-1:8080/card';
  private readonly LESSONS_STORAGE_KEY = 'app-lessons-data';
  private readonly AUTH_TOKEN_KEY = 'auth-token';
  private readonly CARD_DETAIL_STORAGE_KEY_PREFIX = 'app-card-detail-'; // New key for individual card caching

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cookiesService: CookiesService
  ) { }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  public initializeData(): Observable<Lesson[] | null> {
    if (!this.isBrowser()) {
      return of(null);
    }
    
    const lessonsData = localStorage.getItem(this.LESSONS_STORAGE_KEY);
    
    if (lessonsData) {
      try {
        const lessons: Lesson[] = JSON.parse(lessonsData);
        console.log('LessonService: Found lessons in localStorage:', lessons);
        
        if (lessons.length > 0) {
          console.log(`LessonService: Successfully loaded ${lessons.length} lessons from localStorage`);
          this.lessonsSubject.next(lessons);
          return of(lessons);
        } else {
          console.log('LessonService: Empty lessons array in localStorage, refreshing from server');
          return this.forceRefreshLessons();
        }
      } catch (e) {
        console.error('LessonService: Error parsing lessons data:', e);
        return this.forceRefreshLessons();
      }
    } else {
      console.log('LessonService: No lessons found in localStorage, refreshing from server');
      return this.forceRefreshLessons();
    }
  }

  private clearLessonsStorage(): void {
    if (!this.isBrowser()) {
      return;
    }
    
    localStorage.removeItem(this.LESSONS_STORAGE_KEY);
    console.log('LessonService: Lessons storage cleared');
  }

  fetchAndSetLessons(): Observable<Lesson[] | null> {
    if (!this.isBrowser()) {
      this.lessonsSubject.next(null);
      return of(null);
    }

    const token = this.cookiesService.getCookie(this.AUTH_TOKEN_KEY);
                 
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return this.http.get<LessonsResponse>(`${this.baseUrl}/get-lessons`, { headers }).pipe(
      map(response => {
        if (response.success && response.body) {
          return response.body;
        }
        console.error('LessonService: Failed to fetch lessons from API - success false or no body:', response.error);
        return null;
      }),
      tap(lessons => {
        if (lessons && lessons.length > 0) {
          this.lessonsSubject.next(lessons);
          
          if (this.isBrowser()) {
            localStorage.setItem(this.LESSONS_STORAGE_KEY, JSON.stringify(lessons));
            console.log(`LessonService: Saved ${lessons.length} lessons in localStorage as a single entry`);
          }
        } else {
          this.lessonsSubject.next(null); 
        }
      }),
      catchError(err => {
        console.error('LessonService: HTTP error fetching lessons:', err);
        this.lessonsSubject.next(null);
        if (this.isBrowser()) {
          this.clearLessonsStorage();
        }
        return of(null); 
      })
    );
  }

  public forceRefreshLessons(): Observable<Lesson[] | null> {
    if (this.isBrowser()) {
      this.clearLessonsStorage();
      console.log('LessonService: Lessons data cleared from localStorage for refresh.');
    }
    return this.fetchAndSetLessons();
  }

  // Повертає всі дані про уроки з картками
  getLessons(): Observable<Lesson[] | null> {
    return this.lessonsSubject.asObservable();
  }

  getBasicLessonsInfo(): Observable<LessonGeneralInfo[] | null> {
    return this.lessonsSubject.pipe(
      map(lessons => {
        if (!lessons) return null;
        return lessons.map(lesson => ({
          id: lesson.id,
          title: lesson.title,
          totalPoints: lesson.totalPoints
        }));
      })
    );
  }

  public ensureDataLoaded(forceServerRequest: boolean = true): Observable<Lesson[] | null> {
    if (!this.isBrowser()) {
      return of(null);
    }
    
    const currentLessons = this.lessonsSubject.getValue();
    
    if (currentLessons && currentLessons.length > 0) {
      return of(currentLessons);
    } else {
      const lessonsData = localStorage.getItem(this.LESSONS_STORAGE_KEY);
      
      if (lessonsData) {
        try {
          const lessons: Lesson[] = JSON.parse(lessonsData);
          if (lessons.length > 0) {
            this.lessonsSubject.next(lessons);
            return of(lessons);
          }
        } catch (e) {
          console.error('LessonService: Error parsing lessons in ensureDataLoaded:', e);
        }
      }
      
      if (forceServerRequest) {
        return this.forceRefreshLessons();
      } else {
        return of(null);
      }
    }
  }

  private fetchAndCacheCardFromServer(cardId: number): Observable<Card | null> {
    const token = this.cookiesService.getCookie(this.AUTH_TOKEN_KEY);
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    } else {
      console.warn(`Auth token not found for fetching card ${cardId}. Educational cards require authentication.`);
      
      return throwError(() => new Error('Authentication required'));
    }

    return this.http.get<CardApiResponse>(`${this.cardBaseUrl}/get-card/${cardId}`, { headers }).pipe(
      map(response => {
        if (response.success && response.body) {
          const apiCardData: ApiResponseCardBody = response.body;

          const questions: Question[] | null = apiCardData.questions 
            ? apiCardData.questions.map((q: any) => ({
                id: q.id,
                questionText: q.questionText,
                answers: q.answers 
                  ? q.answers.map((a: any) => ({
                      id: a.id,
                      answerText: a.answerText,
                    })) 
                  : []
              })) 
            : null;

          const tasks: Task[] | null = apiCardData.tasks 
            ? apiCardData.tasks.map((t: any) => ({
                id: t.id,
                name: t.name,
                description: t.description,
                points: t.points,
                isCompleted: t.isCompleted,
                expectedDataType: t.expectedDataType,
                expectedDataCount: t.expectedDataCount,
              })) 
            : null;
          
          const card: Card = {
            id: apiCardData.id,
            title: apiCardData.title,
            description: apiCardData.description,
            lessonId: apiCardData.lessonId,
            type: apiCardData.type,
            content: apiCardData.content,
            questions: questions,
            tasks: tasks,
            sandboxType: apiCardData.sandboxType,
          };
          
          if (this.isBrowser()) {
            const cardStorageKey = `${this.CARD_DETAIL_STORAGE_KEY_PREFIX}${cardId}`;
            try {
              localStorage.setItem(cardStorageKey, JSON.stringify(card));
              console.log(`LessonsService: Card ${cardId} fetched from API and cached in localStorage.`);
            } catch (e) {
              console.error(`LessonsService: Error saving card ${cardId} to localStorage:`, e);
            }
          }
          return card;
        } else {
          const errorMessage = response.error || 'Unknown error';
          
          if (errorMessage.includes('authenticate') || errorMessage.includes('auth') || 
              errorMessage.includes('token') || errorMessage.includes('login')) {
            console.error(`LessonsService: Authentication error fetching card ${cardId}. Error: ${errorMessage}`);
            
            if (this.isBrowser() && token) {
              console.warn('LessonsService: Clearing potentially invalid auth token from cookies');
              this.cookiesService.deleteCookie(this.AUTH_TOKEN_KEY);
            }
            
          } else {
            console.error(`LessonsService: Failed to fetch card details for ID ${cardId} from API. Error: ${errorMessage}`);
          }
          return null;
        }
      }),
      catchError(err => {
        console.error(`LessonsService: HTTP error fetching card ${cardId}:`, err);
        
        if (err.status === 401 || err.status === 403) {
          console.warn('LessonsService: Authentication error detected. User may need to log in again.');
          
          if (this.isBrowser() && token) {
            this.cookiesService.deleteCookie(this.AUTH_TOKEN_KEY);
          }
          
        }
        
        return of(null);
      })
    );
  }
  
  private clearCardFromStorage(cardId: number): void {
    if (!this.isBrowser()) {
      return;
    }
    const cardStorageKey = `${this.CARD_DETAIL_STORAGE_KEY_PREFIX}${cardId}`;
    localStorage.removeItem(cardStorageKey);
    console.log(`LessonsService: Cleared card ${cardId} from localStorage.`);
  }

  public forceRefreshCardById(cardId: number): Observable<Card | null> {
    if (this.isBrowser()) {
      this.clearCardFromStorage(cardId);
    }
    console.log(`LessonsService: Forcing refresh for card ${cardId}. Fetching from server.`);
    return this.fetchAndCacheCardFromServer(cardId);
  }

  
  getCardById(cardId: number): Observable<Card | null> {
    if (!this.isBrowser()) {
      return of(null);
    }

    const cardStorageKey = `${this.CARD_DETAIL_STORAGE_KEY_PREFIX}${cardId}`;
    const cachedCardJson = localStorage.getItem(cardStorageKey);

    if (cachedCardJson) {
      try {
        const cachedCard: Card = JSON.parse(cachedCardJson);
        
        if (cachedCard && cachedCard.id === cardId) {
          console.log(`LessonsService: Card ${cardId} found in localStorage.`);
          return of(cachedCard);
        } else {
          console.warn(`LessonsService: Invalid cached data for card ${cardId}. Removing from localStorage.`);
          localStorage.removeItem(cardStorageKey);
        }
      } catch (e) {
        console.error(`LessonsService: Error parsing cached card ${cardId} from localStorage:`, e);
        localStorage.removeItem(cardStorageKey); 
      }
    }
    
    console.log(`LessonsService: Card ${cardId} not found in localStorage or cache invalid. Fetching from server.`);
    return this.fetchAndCacheCardFromServer(cardId);
  }
}
