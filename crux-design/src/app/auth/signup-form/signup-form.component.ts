import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { first } from 'rxjs';
import { AuthServiceService, User } from '../../services/auth-service.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './signup-form.component.html',
  styleUrl: './signup-form.component.css'
})
export class SignupFormComponent {
  @Output() switchToLogin = new EventEmitter<void>();
  
  signupForm: any;
  signupError: string = '';
  
  onSwitchToLogin() {
    this.switchToLogin.emit();
  }

  constructor(public formBuilder:FormBuilder, private service: AuthServiceService, private router: Router){
    this.signupForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.pattern(/^(?=.*[a-zа-яіїєґ])(?=.*[A-ZА-ЯІЇЄҐ])[A-Za-zА-Яа-яІіЇїЄєҐґ]+$/)]],
      lastName: ['', [Validators.required, Validators.pattern(/^(?=.*[a-zа-яіїєґ])(?=.*[A-ZА-ЯІЇЄҐ])[A-Za-zА-Яа-яІіЇїЄєҐґ]+$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])[A-Za-z\d@$!%*?&]+$/)]],
      confirmPassword: ['', [Validators.required]]
    }, { 
      validators: this.passwordMatch 
    });
    
  }

  passwordMatch: ValidatorFn = (control: AbstractControl): null | { [key: string]: boolean } => {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({...confirmPassword.errors, passwordMismatch: true});
      return { passwordMismatch: true };
    } else if (confirmPassword?.errors?.['passwordMismatch']) {
      const errors = {...confirmPassword.errors};
      delete errors['passwordMismatch'];
      confirmPassword.setErrors(Object.keys(errors).length ? errors : null);
    }
    
    return null;
  }

  onSubmit() {
    if (this.signupForm.valid) {
      console.log(this.signupForm.value);
      this.signupError = ''; // Clear any previous errors
      this.service.createUser(this.signupForm.value).subscribe({
        next:(user: User | null)=>{
          if (user) {
            //console.log("Signup successful, user data fetched by service:", user);
            this.router.navigate(['/profile']);
          } else {
            console.error("Signup completed but failed to fetch user details.");
            this.signupError = 'Реєстрація пройшла успішно, але не вдалося завантажити дані користувача. Спробуйте ще раз.';
          }
        },        error:err=>{
          console.log("Error during signup process: ", err);
          
          // Check for specific error types based on the API response structure
          if (err) {
            // Check different possible locations for error message
            const errorMessage = err.body?.error || err.error?.body?.error || err.error?.error || err.error?.message || err.message || '';
            
            console.log("Extracted error message:", errorMessage);
            
            if (errorMessage.toLowerCase().includes('email') || 
                errorMessage.toLowerCase().includes('користувач') || 
                errorMessage.toLowerCase().includes('exists') ||
                errorMessage.toLowerCase().includes('already') ||
                errorMessage.toLowerCase().includes('вже')) {
              this.signupError = 'Ця електронна адреса вже зареєстрована.';
            } else if (err.status === 400) {
              this.signupError = 'Неправильні дані для реєстрації. Перевірте введені дані та спробуйте ще раз.';
            } else if (err.status === 500) {
              this.signupError = 'Помилка сервера. Спробуйте пізніше.';
            } else {
              this.signupError = errorMessage || 'Помилка реєстрації. Спробуйте пізніше.';
            }
          } else {
            this.signupError = 'Помилка реєстрації. Спробуйте пізніше.';
          }
        }
      });
    } else {
      console.log('Form is invalid');
      Object.keys(this.signupForm.controls).forEach(field => {
        const control = this.signupForm.get(field);
        control?.markAsTouched();
      });
    }
  }
}
