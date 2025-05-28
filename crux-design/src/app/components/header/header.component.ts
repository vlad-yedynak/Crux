import { Component, ElementRef, HostListener, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { NavigationComponent } from '../navigation/navigation.component';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { RouterModule, Router, NavigationEnd } from '@angular/router'; // Import NavigationEnd
import { AuthServiceService, User} from '../../services/auth-service.service';
import { isPlatformBrowser } from '@angular/common';
import { CookiesService } from '../../services/cookies.service'; // Import CookiesService
import { filter } from 'rxjs/operators'; // Import filter operator

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    NgbDropdownModule,
    RouterModule,
    NavigationComponent,
  ], 
  animations: [
    trigger('dropdownAnimation', [

      transition(':enter', [
        style({
          opacity: 0,
          transform: 'scaleY(0)',  
          transformOrigin: 'top', 
          filter: 'blur(2px)',     
        }),
        animate(
          '300ms cubic-bezier(0.42, 0, 0.58, 1)',  
          style({
            opacity: 1,
            transform: 'scaleY(1)',  
            filter: 'blur(0)',      
          })
        ),
      ]),
    
      transition(':leave', [
        style({ 
          opacity: 1,
          transform: 'scaleY(1)',
          transformOrigin: 'top',
          filter: 'blur(0)',
        }),
        animate(
          '300ms cubic-bezier(0.42, 0, 0.58, 1)',  
          style({
            opacity: 0,
            transform: 'scaleY(0)', 
            transformOrigin: 'top',
            filter: 'blur(2px)',
          })
        ),
      ]),
    ]),
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit{
  // isOpen = false; // Commented out for language selection
  isUserDropdownOpen = false;
  isMobileMenuOpen = false; // For mobile navigation state
  // selectedLanguage = 'en'; // Commented out for language selection
  user: User | null = null;
  isAdmin = false;
  private readonly AUTH_TOKEN_KEY = 'auth-token'; // Define the key for the auth token
  
  
  logoLetters: string[] = 'Crux'.split('');

  constructor(
    private eRef: ElementRef, 
    private authService: AuthServiceService, 
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cookiesService: CookiesService // Inject CookiesService
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.isMobileMenuOpen = false; // Close mobile menu on successful navigation
    });
  }

  ngOnInit(): void {
    this.authService.getUser().subscribe(user => {
      this.user = user;
      this.isAdmin = user?.userRole === 'Admin';
    });

    if (isPlatformBrowser(this.platformId)) {
      const token = this.cookiesService.getCookie(this.AUTH_TOKEN_KEY); 
      if (token && !this.authService.isLoggedIn()) { 
        // console.log('Header: Token found in cookies, but no user in service. Attempting to fetch user.');
        this.authService.fetchAndSetUser().subscribe({
            next: (fetchedUser) => {
                // if(fetchedUser) console.log('Header: User fetched successfully on init.');
                // else console.log('Header: User fetch on init did not return a user (e.g. bad token).');
            },
            error: (err) => console.error('Header: Error fetching user on init:', err)
        });
      }
    }
  }

  // toggleDropdownLang() { // Commented out for language selection
  //   this.isOpen = !this.isOpen;
  // }

  toggleDropdownUser() {
    this.isUserDropdownOpen = !this.isUserDropdownOpen;
    // this.isOpen = false; // Close language dropdown if user dropdown is toggled // Commented out
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  // selectLanguage(lang: string) { // Commented out for language selection
  //   this.selectedLanguage = lang;
  //   this.isOpen = false;
  // }

  // getLanguageLabel(lang: string): string { // Commented out for language selection
  //   return lang === 'en' ? 'EN' : 'UA';
  // }

  goToProfile() {
    this.isUserDropdownOpen = false;
    this.router.navigate(['/profile']);
  }

  logout() {
    this.isUserDropdownOpen = false;
    this.authService.logout();
    this.isAdmin = false; 
    this.router.navigate(['/auth']);
  }

  getUserAvatar(): string {
    // Return the user's avatar if available, otherwise return the default avatar
    return this.user?.avatar || 'profile_placeholder.jpg';
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    const clickedElement = event.target as Element;

    if (this.isUserDropdownOpen && !clickedElement.closest('.user-info')) {
      this.isUserDropdownOpen = false;
    }

    // Mobile Menu
    // Check if the click was outside the toggle button and outside the navigation wrapper
    const mobileMenuToggle = this.eRef.nativeElement.querySelector('.mobile-menu-toggle');
    const navigationWrapper = this.eRef.nativeElement.querySelector('.navigation-wrapper');

    if (this.isMobileMenuOpen) {
      const clickedOnToggle = mobileMenuToggle && mobileMenuToggle.contains(clickedElement);
      const clickedInsideNavWrapper = navigationWrapper && navigationWrapper.contains(clickedElement);

      if (!clickedOnToggle && !clickedInsideNavWrapper) {
        this.isMobileMenuOpen = false;
      }
    }
  }

}