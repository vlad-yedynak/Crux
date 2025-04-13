import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginFormComponent } from '../login-form/login-form.component';
import { SignupFormComponent } from '../signup-form/signup-form.component';
import { trigger, state, style, transition, animate, keyframes  } from '@angular/animations';
import { RouterModule } from '@angular/router';

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
  
  switchForm() {
    this.activeForm = this.activeForm === 'login' ? 'signup' : 'login';
  }
}
