import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { AuthServiceService, User } from '../../auth/services/auth-service.service';
import { response } from 'express';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule  } from '@angular/forms';
import { CommonModule } from '@angular/common';
 
@Component({
  standalone: true,
  selector: 'app-profile',
  imports: [FormsModule,CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})

export class ProfileComponent implements OnInit{
  userInfo: User | null = null;

  constructor(
    private authService: AuthServiceService,
    @Inject(PLATFORM_ID) private platformId: Object
  ){
    if (isPlatformBrowser(this.platformId)) {
      console.log("Current session token: ", localStorage.getItem('auth-token'));
    }
  }

  ngOnInit(): void {
    this.authService.getUser().subscribe(user => {
      this.userInfo = user;
    });
    

    this.authService.fetchAndSetUser();
  }
}
