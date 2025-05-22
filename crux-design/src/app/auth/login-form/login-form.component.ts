import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthServiceService, User } from '../services/auth-service.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.css'
})
export class LoginFormComponent {
  @Output() switchToSignup = new EventEmitter<void>();
  
  loginForm: FormGroup;
  loginError: string = '';
  
  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthServiceService,
    private router: Router
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }
  
  onSwitchToSignup() {
    this.switchToSignup.emit();
  }
  
  onSubmit() {
    if (this.loginForm.valid) {
      this.loginError = '';
      this.authService.loginUser(this.loginForm.value).subscribe({
        next: (user: User | null) => {
          if (user) {
            console.log('Login successful, user data fetched by service:', user);
            this.router.navigate(['/profile']);
          } else {
            this.loginError = 'Login succeeded but failed to load user data. Please try again.';
            console.error('Login succeeded but failed to load user data.');
          }
        },
        error: (err) => {
          this.loginError = 'Invalid email or password. Please try again.';
          console.error('Login failed:', err);
        }
      });
    } else {
      Object.keys(this.loginForm.controls).forEach(field => {
        const control = this.loginForm.get(field);
        if (control?.errors) {
          console.log(`Validation errors in ${field}:`, control.errors);
        }
        control?.markAsTouched();
      });
    }
  }
}
