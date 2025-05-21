import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private router: Router) {}

  logout(): void {
    // Set role to "User" before clearing token
    localStorage.setItem('Role', 'User');
    
    // Clear auth token
    localStorage.removeItem('auth-token');
    
    // Navigate to login or home page
    this.router.navigate(['/auth']);
  }
}