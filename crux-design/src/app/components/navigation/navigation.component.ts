import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from "@angular/common";
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navigation',
  imports: [
    CommonModule,
    RouterModule
  ],
  template: `
    <nav class="tab-navigation">
        <ul class="tabs">
            <li class="tab-item"><a [routerLink]="['/lessons']">Lessons</a></li>
            <li class="tab-item"><a href="#materials">Materials</a></li>
            <li class="tab-item"><a href="#other">Other</a></li>
            <li class="tab-item" *ngIf="isAdmin"><a [routerLink]="['/admin']">Edit content</a></li>
        </ul>
    </nav>
  `,
  styleUrl: './navigation.component.css'
})
export class NavigationComponent implements OnInit, OnDestroy {
  isAdmin: boolean = false;
  private authCheckInterval: any = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.checkAdminStatus();
      
      this.authCheckInterval = setInterval(() => {
        this.checkAdminStatus();
      }, 2000); // Check every 2 seconds
    }
  }

  ngOnDestroy() {
    // Clear the interval when component is destroyed
    if (this.authCheckInterval && isPlatformBrowser(this.platformId)) {
      clearInterval(this.authCheckInterval);
    }
  }

  private checkAdminStatus() {
    if (isPlatformBrowser(this.platformId)) {
      try {
        // Default to false (not admin)
        const newAdminStatus = localStorage.getItem('Role') === 'Admin';
        
        // Only update if there's a change to avoid unnecessary renders
        if (this.isAdmin !== newAdminStatus) {
          this.isAdmin = newAdminStatus;
          console.log('Admin status updated:', this.isAdmin);
        }
      } catch (e) {
        console.error('Error accessing localStorage:', e);
        this.isAdmin = false;
      }
    } else {
      this.isAdmin = false; // Default for non-browser environments
    }
  }
}
