import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { tap, catchError, switchMap, map } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { CookiesService } from './cookies.service';
import { ConfigService } from './config.service';

export interface User {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  scorePoints?: { [lessonId: string]: number };
  userRole: string;
  avatar?: string; // URL to the user's avatar image
}

interface AuthResponse {
  body: {
    userId: string;
    token: string;
    success: boolean;
    error: null | string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthServiceService {
  private userSubject = new BehaviorSubject<User | null>(null);
  private readonly AUTH_TOKEN_KEY = 'auth-token';
  private readonly AUTH_USER_KEY = 'auth-user';
  private readonly USER_ID_KEY = 'user-id'; // New key for storing userId separately

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cookiesService: CookiesService, // Додано CookiesService
    private configService: ConfigService // Injected ConfigService
  ) {
    this.loadUserFromStorage();
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private loadUserFromStorage() {
    if (!this.isBrowser()) return;

    // Тепер отримуємо дані тільки з cookies
    const token = this.cookiesService.getCookie(this.AUTH_TOKEN_KEY);
    const storedUser = this.cookiesService.getCookie(this.AUTH_USER_KEY);

    if (token && storedUser) {
      try {
        const user: User = JSON.parse(storedUser);
        this.userSubject.next(user);
        // console.log('AuthService: User data loaded from cookies');
      } catch (e) {
        console.error('Error parsing stored user data:', e);
        this.cookiesService.deleteCookie(this.AUTH_USER_KEY);
        this.logout();
      }
    } else if (token && this.userSubject.value === null) {
      this.fetchAndSetUser().subscribe({
        next: (user) => {
          // if (user) {
          //   console.log('AuthService: User data proactively fetched during loadUserFromStorage.');
          // } else {
          //   console.warn('AuthService: Proactive fetch during loadUserFromStorage did not return a user (or token was invalid).');
          // }
        },
        error: (err) => {
          console.error('AuthService: Error during proactive user data fetch in loadUserFromStorage:', err);
        }
      });
    } else if (token && this.userSubject.value !== null) {
      // console.log('AuthService: Token found in cookies, and user data already present in the service.');
    } else {
      // console.log('AuthService: No token found in cookies.');
    }
  }

  public forceRefreshUserData(): Observable<User | null> {
    if (this.isBrowser()) {
      this.cookiesService.deleteCookie(this.AUTH_USER_KEY); // Видаляємо і з cookies
      // console.log('AuthService: User data cookie deleted for refresh.');
    }
    return this.fetchAndSetUser();
  }
  createUser(formData: any): Observable<User | null> {
    return this.http.post<AuthResponse>(this.configService.getEndpoint('/user/sign-up'), formData).pipe(
      switchMap(response => {
        // Check if the response indicates success
        if (response.body?.success === false) {
          return throwError(() => ({ body: response.body }));
        }
        
        const token = response.body?.token;
        const userId = response.body?.userId;
        
        if (token && this.isBrowser()) {
          this.cookiesService.setCookie(this.AUTH_TOKEN_KEY, token, 1);
          console.log('AuthService: Token saved to cookies:', token);
          
          // Immediately store numeric userId in cookies and localStorage if available
          if (userId) {
            this.cookiesService.setCookie(this.USER_ID_KEY, userId, 1);
            localStorage.setItem('userId', userId);
            console.log('AuthService: UserId stored from signup response:', userId);
          }
          
          return this.fetchAndSetUser();
        }
        console.error('Signup response did not include a token in body.token.');
        return throwError(() => new Error('Signup failed: No token received.'));
      }),
      tap(user => {
        // Only store the numeric userId, don't use email as fallback
        if (user && user.userId) {
          this.cookiesService.setCookie(this.USER_ID_KEY, user.userId, 1);
          localStorage.setItem('userId', user.userId);
          console.log('AuthService: UserId stored in cookies and localStorage:', user.userId);
        }
      }),
      catchError(err => {
        console.error("Error in createUser chain:", err);
        return throwError(() => err);
      })
    );
  }

  loginUser(formData: any): Observable<User | null> {
    return this.http.post<AuthResponse>(this.configService.getEndpoint('/user/sign-in'), formData).pipe(
      switchMap(response => {
        const token = response.body?.token;
        const userId = response.body?.userId;
        
        if (token && this.isBrowser()) {
          this.cookiesService.setCookie(this.AUTH_TOKEN_KEY, token, 1);
          console.log('AuthService: Token saved to cookies:', token);
          
          // Immediately store numeric userId in cookies and localStorage if available
          if (userId) {
            this.cookiesService.setCookie(this.USER_ID_KEY, userId, 1);
            localStorage.setItem('userId', userId);
            console.log('AuthService: UserId stored from login response:', userId);
          }
          
          return this.fetchAndSetUser();
        }
        console.error('Login response did not include a token in body.token.');
        return throwError(() => new Error('Login failed: No token received.'));
      }),
      tap(user => {
        // Only store the numeric userId, don't use email as fallback
        if (user && user.userId) {
          this.cookiesService.setCookie(this.USER_ID_KEY, user.userId, 1);
          localStorage.setItem('userId', user.userId);
          console.log('AuthService: UserId stored in cookies and localStorage:', user.userId);
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

    const token = this.cookiesService.getCookie(this.AUTH_TOKEN_KEY);
                 
    if (!token) {
      this.userSubject.next(null);
      return of(null);
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<{ body: User }>(this.configService.getEndpoint('/user/info'), { headers }).pipe(
      map(res => res.body), 
      tap({
        next: (user) => {
          if (user) {
            // Don't set userId to email anymore
            this.userSubject.next(user);
            
            if (this.isBrowser()) {
              const userJson = JSON.stringify(user);
              this.cookiesService.setCookie(this.AUTH_USER_KEY, userJson, 1);
              
              // Only store userId if it's a valid number/string, don't use email
              if (user.userId) {
                this.cookiesService.setCookie(this.USER_ID_KEY, user.userId, 1);
                localStorage.setItem('userId', user.userId);
                console.log('AuthService: UserId stored in cookies and localStorage:', user.userId);
              }
              
              console.log('AuthService: User data saved to cookies:', user);
            }
          } else {
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
      this.cookiesService.deleteCookie(this.AUTH_TOKEN_KEY);
      this.cookiesService.deleteCookie(this.AUTH_USER_KEY);
      this.cookiesService.deleteCookie(this.USER_ID_KEY); // Also clear userId cookie
      
      // Clear all localStorage data instead of specific items
      localStorage.clear();
      
      console.log('AuthService: Auth data cleared from cookies and localStorage.');
    }
    this.userSubject.next(null);
    // console.log('User logged out, all auth data cleared from cookies.');
  }

  changeFirstName(newFirstName: string) {
    const currentUser = this.userSubject.value;
    if (currentUser && currentUser.firstName === newFirstName) {
      console.log('First name is the same, no update needed.');
      return of(currentUser); 
    }
    const token = this.cookiesService.getCookie(this.AUTH_TOKEN_KEY);
    if (!token || !this.isBrowser()) {
      this.logout(); 
      return throwError(() => new Error('User not authenticated or not in browser for changing first name.'));
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  
    return this.http.put(this.configService.getEndpoint('/user/change-first-name'), JSON.stringify(newFirstName), { headers }).pipe(
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
      console.log('Last name is the same, no update needed.');
      return of(currentUser); 
    }

    const token = this.cookiesService.getCookie(this.AUTH_TOKEN_KEY);
    if (!token || !this.isBrowser()) {
      this.logout(); 
      return throwError(() => new Error('User not authenticated or not in browser for changing last name.'));
    }
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  
    return this.http.put(this.configService.getEndpoint('/user/change-last-name'), JSON.stringify(newLastName), { headers }).pipe(
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

  updateAvatar(imageData: string, contentType: string) {
    const token = this.cookiesService.getCookie(this.AUTH_TOKEN_KEY);
    if (!token || !this.isBrowser()) {
      this.logout(); 
      return throwError(() => new Error('User not authenticated or not in browser for updating avatar.'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const requestBody = {
      data: imageData,
      contentType: contentType
    };
  
    return this.http.put(this.configService.getEndpoint('/user/update-avatar'), requestBody, { headers }).pipe(
      switchMap(() => {
        return this.forceRefreshUserData();
      }),
      catchError(err => {
        console.error('Error updating avatar or refreshing user data:', err);
        if (err.status === 401 || err.status === 403) {
            this.logout();
        }
        return throwError(() => err);
      })
    );
  }
}
