import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from "@angular/common";
import { RouterModule } from '@angular/router';
import { AuthServiceService } from '../../services/auth-service.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navigation',
  imports: [
    CommonModule,
    RouterModule
  ],  template: `
    <nav class="tab-navigation">
        <ul class="tabs">
            <li class="tab-item"><a [routerLink]="['/lessons']">Уроки</a></li>
            <li class="tab-item"><a [routerLink]="['/foryou']">Рекомендації</a></li>
            <li class="tab-item"><a [routerLink]="['/about']">Про нас</a></li>
            <li class="tab-item" *ngIf="isAdmin"><a [routerLink]="['/admin']">Редагувати контент</a></li>
        </ul>
    </nav>
  `,
  styleUrl: './navigation.component.css',
  standalone: true
})
export class NavigationComponent implements OnInit, OnDestroy {
  isAdmin: boolean = false;
  private userSubscription: Subscription | null = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private authService: AuthServiceService
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.userSubscription = this.authService.getUser().subscribe(user => {
        if (user) {
          this.isAdmin = user.userRole === 'Admin';
        } else {
          this.isAdmin = false;
        }
      });
    }
  }

  ngOnDestroy() {
    // Clean up subscription when component is destroyed
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
      this.userSubscription = null;
    }
  }
}
