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
  scorePoints?: { [lessonId: string]: number }; // Changed from lessonScores, to match backend
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
        localStorage.removeItem(this.AUTH_USER_KEY);
        this.logout(); 
      }
    } else if (token && this.userSubject.value === null) { 
      this.fetchAndSetUser().subscribe({
        next: (user) => {
          if (user) {
            console.log('AuthService: User data proactively fetched during loadUserFromStorage.');
          } else {
            console.warn('AuthService: Proactive fetch during loadUserFromStorage did not return a user (or token was invalid).');
          }
        },
        error: (err) => {
          console.error('AuthService: Error during proactive user data fetch in loadUserFromStorage:', err);
        }
      });
    } else if (token && this.userSubject.value !== null) {
      console.log('AuthService: Token found, and user data already present in the service.');
    } else {
      console.log('AuthService: No token found in localStorage.');
    }
  }

  public forceRefreshUserData(): Observable<User | null> {
    if (this.isBrowser()) {
      localStorage.removeItem(this.AUTH_USER_KEY);
    }
    return this.fetchAndSetUser();
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
    }
    this.userSubject.next(null);
    console.log('User logged out, all auth data cleared.');
  }

  changeFirstName(newFirstName: string) {
    const currentUser = this.userSubject.value;
    if (currentUser && currentUser.firstName === newFirstName) {
      console.log('First name is the same, no update needed.');
      return of(currentUser); 
    }
    const token = localStorage.getItem(this.AUTH_TOKEN_KEY); 
    if (!token || !this.isBrowser()) {
      this.logout(); 
      return throwError(() => new Error('User not authenticated or not in browser for changing first name.'));
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  
    return this.http.put(this.baseUrl + '/change-first-name', JSON.stringify(newFirstName), { headers }).pipe(
      switchMap(() => {
        return this.forceRefreshUserData();
      }),
      catchError(err => {
        console.error('Error updating first name or refreshing user data:', err);
        if (err.status === 401 || err.status === 403) {
            this.logout();
        }
        return throwError(() => err);
      })
    );
  }
  
  changeLastName(newLastName: string) {
    const currentUser = this.userSubject.value;
    if (currentUser && currentUser.lastName === newLastName) {
      console.log('First name is the same, no update needed.');
      return of(currentUser); 
    }

    const token = localStorage.getItem(this.AUTH_TOKEN_KEY); 
    if (!token || !this.isBrowser()) {
      this.logout(); 
      return throwError(() => new Error('User not authenticated or not in browser for changing last name.'));
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  
    return this.http.put(this.baseUrl + '/change-last-name', JSON.stringify(newLastName), { headers }).pipe(
      switchMap(() => {
        return this.forceRefreshUserData();
      }),
      catchError(err => {
        console.error('Error updating last name or refreshing user data:', err);
        if (err.status === 401 || err.status === 403) {
            this.logout();
        }
        return throwError(() => err);
      })
    );
  }
}
