import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthServiceService {
  private userSubject = new BehaviorSubject<User | null>(null);
  private baseUrl = 'http://localhost:8080/user';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  createUser(formData: any) {
    return this.http.post(this.baseUrl + '/sign-up', formData);
  }

  loginUser(formData: any) {
    return this.http.post<{body: { token: string }, success: boolean, error: any }>(this.baseUrl + '/sign-in', formData).pipe(
      tap(response => {
        console.log('Response from login:', response);
        console.log('User:',response.body.token);
        const token = response.body.token;
        if (token && this.isBrowser()) {
          localStorage.setItem('auth-token', token);
          this.fetchAndSetUser();
        }
      })
    );
  }

  fetchAndSetUser() {
    if (!this.isBrowser()) return;

    const token = localStorage.getItem('auth-token');
    if (!token) return;

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<{ body: User }>(this.baseUrl + '/info', { headers }).subscribe({
      next: (res) => {
        this.userSubject.next(res.body);
        
        console.log('Complete user information after login:', res.body);
      },
      error: (err) => {
        console.error('Failed to fetch user info:', err);
        this.logout();
      }
    });
  }

  getUser(): Observable<User | null> {
    return this.userSubject.asObservable();
  }

  isLoggedIn(): boolean {
    return this.userSubject.value !== null;
  }

  logout() {
    if (this.isBrowser()) {
      localStorage.removeItem('auth-token');
    }
    this.userSubject.next(null);
  }
}
