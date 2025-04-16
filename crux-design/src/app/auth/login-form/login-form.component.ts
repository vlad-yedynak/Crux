import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthServiceService } from '../services/auth-service.service';
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
      console.log('Form submission attempt with:', this.loginForm.value);
      this.authService.loginUser(this.loginForm.value).subscribe({
        next: (res: any) => {
          console.log('Login response:', res);
          const token = res?.token || res?.body?.token;
          if (token) {
            console.log('Authentication successful, token received');
            localStorage.setItem('auth-token', token);
            this.router.navigate(['/profile']);
          } else {
            console.warn(res.body.error);
          }
        },
        error: (err: any) => {
          console.error('Login failed:', err);
          console.log('Error details:', err.error || err.message);
        }
      });
    } else {
      console.log('Form invalid, validation errors:');
      Object.keys(this.loginForm.controls).forEach(field => {
        const control = this.loginForm.get(field);
        if (control?.errors) {
          console.log(`Field ${field} errors:`, control.errors);
        }
        control?.markAsTouched();
      });
    }
  }
}
