import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { tap, catchError, switchMap, map } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  scorePoints?: string;
  userRole: string;
  avatarUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthServiceService {
  private userSubject = new BehaviorSubject<User | null>(null);
  private baseUrl = 'http://localhost:8080/user';
  private readonly AUTH_TOKEN_KEY = 'auth-token';
  private readonly AUTH_USER_KEY = 'auth-user';
  private readonly USER_ROLE_KEY = 'Role';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.loadUserFromStorage();
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private loadUserFromStorage() {
    if (!this.isBrowser()) return;

    const token = localStorage.getItem(this.AUTH_TOKEN_KEY);
    const storedUser = localStorage.getItem(this.AUTH_USER_KEY);

    if (token && storedUser) {
      try {
        const user: User = JSON.parse(storedUser);
        this.userSubject.next(user);
      } catch (e) {
        console.error('Error parsing stored user data:', e);
        this.logout(); 
      }
    } else if (token) {
      // Token exists, but no user data.
      // HeaderComponent will attempt to fetch if user is not in subject.
      console.log('Token found in localStorage, but no user data. User will be fetched if needed.');
    }
  }

  createUser(formData: any): Observable<User | null> {
    return this.http.post<{ body: { token: string } }>(this.baseUrl + '/sign-up', formData).pipe(
      switchMap(response => {
        const token = response.body?.token;
        if (token && this.isBrowser()) {
          localStorage.setItem(this.AUTH_TOKEN_KEY, token);
          return this.fetchAndSetUser();
        }
        console.error('Signup response did not include a token in body.token.');
        return throwError(() => new Error('Signup failed: No token received.'));
      }),
      tap(user => {
        if (user) {
          console.log("Signup and user fetch successful in service.");
        } else {
          console.log("Signup successful, but user data could not be fetched or token was missing.");
        }
      }),
      catchError(err => {
        console.error("Error in createUser chain:", err);
        return throwError(() => err);
      })
    );
  }

  loginUser(formData: any): Observable<User | null> {
    return this.http.post<{ body: { token: string } }>(this.baseUrl + '/sign-in', formData).pipe(
      switchMap(response => {
        const token = response.body?.token;
        if (token && this.isBrowser()) {
          localStorage.setItem(this.AUTH_TOKEN_KEY, token);
          return this.fetchAndSetUser();
        }
        console.error('Login response did not include a token in body.token.');
        return throwError(() => new Error('Login failed: No token received.'));
      }),
      tap(user => {
        if (user) {
          console.log("Login and user fetch successful in service. User:", user);
        } else {
          console.log("Login successful (token received), but user data could not be fetched.");
        }
      }),
      catchError(err => {
        console.error("Error in loginUser chain:", err);
        if (err.status === 401 || err.status === 403) { 
            this.logout();
        }
        return throwError(() => err);
      })
    );
  }

  fetchAndSetUser(): Observable<User | null> {
    if (!this.isBrowser()) return of(null);

    const token = localStorage.getItem(this.AUTH_TOKEN_KEY);
    if (!token) {
      this.userSubject.next(null);
      if (this.isBrowser()) {
        localStorage.removeItem(this.AUTH_USER_KEY);
        localStorage.removeItem(this.USER_ROLE_KEY); // Also clear role if token is gone
      }
      return of(null);
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<{ body: User }>(this.baseUrl + '/info', { headers }).pipe(
      map(res => res.body), 
      tap({
        next: (user) => {
          if (user) {
            this.userSubject.next(user);
            if (this.isBrowser()) {
              localStorage.setItem(this.AUTH_USER_KEY, JSON.stringify(user));
              localStorage.setItem(this.USER_ROLE_KEY, user.userRole);
            }
            console.log('User info fetched and stored:', user);
          } else {
            // This case should ideally not happen if API returns error for bad token
            console.warn('Fetched user info is null/undefined, logging out.');
            this.logout();
          }
        },
        error: (err) => {
          console.error('Failed to fetch user info:', err);
          this.logout();
        }
      }),
      catchError((err) => {
        this.logout();
        return throwError(() => err); 
      })
    );
  }

  getUser(): Observable<User | null> {
    return this.userSubject.asObservable();
  }

  isLoggedIn(): boolean {
    return this.userSubject.value !== null;
  }

  logout() {
    if (this.isBrowser()) {
      localStorage.removeItem(this.AUTH_TOKEN_KEY);
      localStorage.removeItem(this.AUTH_USER_KEY);
      localStorage.removeItem(this.USER_ROLE_KEY);
    }
    this.userSubject.next(null);
    console.log('User logged out, all auth data cleared.');
  }

  changeFirstName(newFirstName: string) {
    const token = localStorage.getItem('auth-token'); // Отримуємо токен із localStorage
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  
    return this.http.put(this.baseUrl + '/change-first-name', JSON.stringify(newFirstName), { headers });
  }
  
  changeLastName(newLastName: string) {
    const token = localStorage.getItem('auth-token'); 
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  
    return this.http.put(this.baseUrl + '/change-last-name', JSON.stringify(newLastName), { headers });
  }
}
