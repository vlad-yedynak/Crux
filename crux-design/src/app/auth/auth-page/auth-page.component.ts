import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { LoginFormComponent } from '../login-form/login-form.component';
import { SignupFormComponent } from '../signup-form/signup-form.component';
import { trigger, state, style, transition, animate, keyframes  } from '@angular/animations';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { AuthServiceService } from '../services/auth-service.service';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [
    CommonModule,
    LoginFormComponent,
    SignupFormComponent,
    RouterModule,
  ],
  animations:[
    trigger('formSwitch', [
      state('login', style({
        transform: 'translateX(0) translateZ(0)',
        opacity: 1,
        zIndex: 2
      })),
      state('signup', style({
        transform: 'translateX(125%) translateZ(-100px)',
        opacity: 0.5,
        zIndex: 1
      })),
      transition('login => signup', [
        animate('1.5s cubic-bezier(0.68, -0.55, 0.27, 1.55)', keyframes([
          style({ transform: 'translateX(0) translateZ(0)', opacity: 1, zIndex: 2, offset: 0 }),
          style({ transform: 'translateX(50%) translateZ(-50px)', opacity: 0.8, zIndex: 2, offset: 0.25 }),
          style({ transform: 'translateX(80%) translateZ(-80px)', opacity: 0.6, zIndex: 2, offset: 0.5 }),
          style({ transform: 'translateX(100%) translateZ(-100px)', opacity: 0.5, zIndex: 2, offset: 0.75 }),
          style({ transform: 'translateX(125%) translateZ(-100px)', opacity: 0.4, zIndex: 2, offset: 1 })
        ]))
      ]),
      transition('signup => login', [
        animate('1.5s cubic-bezier(0.68, -0.55, 0.27, 1.55)', keyframes([
          style({ transform: 'translateX(125%) translateZ(-100px)', opacity: 0.4, zIndex: 2, offset: 0 }),
          style({ transform: 'translateX(100%) translateZ(-100px)', opacity: 0.5, zIndex: 2, offset: 0.25 }),
          style({ transform: 'translateX(50%) translateZ(-50px)', opacity: 0.7, zIndex: 2, offset: 0.5 }),
          style({ transform: 'translateX(30%) translateZ(-30px)', opacity: 0.8, zIndex: 2, offset: 0.75 }),
          style({ transform: 'translateX(0) translateZ(0)', opacity: 1, zIndex: 2, offset: 1 })
        ]))
      ])
    ])
  ],
  templateUrl: './auth-page.component.html',
  styleUrl: './auth-page.component.css'
})
export class AuthPageComponent {
  activeForm: 'login' | 'signup' = 'login';

  constructor(
    private route: ActivatedRoute, 
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private authService: AuthServiceService
  ) {
    // Check query param on init
    this.route.queryParams.subscribe(params => {
      if (params['signup'] === '1') {
        this.activeForm = 'signup';
      }
    });
  }
  
  switchForm() {
    this.activeForm = this.activeForm === 'login' ? 'signup' : 'login';
    // Update URL query parameter without navigation side effects if needed
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { signup: this.activeForm === 'signup' ? '1' : null },
      queryParamsHandling: 'merge', // Merge with existing query params
      replaceUrl: true // Replace current history state
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth']);
  }
}
