import { Component, OnInit, HostListener, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { CookiesService } from '../../services/cookies.service';
import { ConfigService } from '../../services/config.service';

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about-page.component.html',
  styleUrl: './about-page.component.css'
})
export class AboutPageComponent {

  constructor(private router: Router) {}

  navigateToLessons(): void {
    this.router.navigate(['/lessons']);
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }
}
