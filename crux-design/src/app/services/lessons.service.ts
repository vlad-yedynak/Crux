import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';


export interface LessonGeneralInfo{
  id: number;
  title: string;
}

export interface LessonsResponse {
  body: LessonGeneralInfo[];
  success: boolean;
  error: string;
  
}

@Injectable({
  providedIn: 'root'
})
export class LessonsService {

  private lessonsSubject = new BehaviorSubject<LessonGeneralInfo[] | null>(null);
  private baseUrl = 'http://localhost:8080/lessons'; 
  private readonly LESSONS_DATA_KEY = 'app-lessons-data'

  constructor(private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object) 
    { 
      this.loadLessonsFromStorage();
    }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private loadLessonsFromStorage(): void {
    if (!this.isBrowser()) {
      return;
    }
    const storedLessons = localStorage.getItem(this.LESSONS_DATA_KEY);
    if (storedLessons) {
      try {
        const lessons: LessonGeneralInfo[] = JSON.parse(storedLessons);
        this.lessonsSubject.next(lessons);
        console.log('LessonService: Lessons loaded from localStorage');
      } catch (e) {
        console.error('LessonService: Error parsing stored lessons data:', e);
        localStorage.removeItem(this.LESSONS_DATA_KEY);
        this.fetchAndSetLessons().subscribe({
            error: err => console.error('LessonService: Failed to fetch lessons after parse error', err)
        });
      }
    } else {
      console.log('LessonService: No lessons in localStorage, fetching...');
      this.fetchAndSetLessons().subscribe({
        error: err => console.error('LessonService: Failed to fetch initial lessons', err)
      });
    }
  }

  fetchAndSetLessons(): Observable<LessonGeneralInfo[] | null> {
    if (!this.isBrowser()) {
      this.lessonsSubject.next(null);
      return of(null);
    }

    const token = localStorage.getItem('auth-token');
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
        if (lessons) {
          this.lessonsSubject.next(lessons);
          if (this.isBrowser()) {
            localStorage.setItem(this.LESSONS_DATA_KEY, JSON.stringify(lessons));
            console.log('LessonService: Lessons fetched and stored in localStorage');
          }
        } else {
          this.lessonsSubject.next(null); 
        }
      }),
      catchError(err => {
        console.error('LessonService: HTTP error fetching lessons:', err);
        this.lessonsSubject.next(null);
        if (this.isBrowser()) {
          localStorage.removeItem(this.LESSONS_DATA_KEY);
        }
        return of(null); 
      })
    );
  }

  public forceRefreshLessons(): Observable<LessonGeneralInfo[] | null> {
    if (this.isBrowser()) {
      localStorage.removeItem(this.LESSONS_DATA_KEY);
      console.log('LessonService: Forcing refresh of lessons. Removed from localStorage.');
    }
    return this.fetchAndSetLessons();
  }

  getLessons(): Observable<LessonGeneralInfo[] | null> {
    return this.lessonsSubject.asObservable();
  }
}
