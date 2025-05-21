import { Component, ElementRef, HostListener, OnInit} from '@angular/core';
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
import { RouterModule, Router } from '@angular/router';
import { AuthServiceService, User} from '../../auth/services/auth-service.service';

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
  isOpen = false;
  isUserDropdownOpen = false;
  selectedLanguage = 'en';
  user: User | null = null;
  isAdmin = false;

  constructor(private eRef: ElementRef, private authService: AuthServiceService, private router: Router) {}

  ngOnInit(): void {
    this.authService.fetchAndSetUser();
    this.authService.getUser().subscribe(user => {
      this.user = user;
    });

    if (localStorage.getItem('Role') === 'Admin') {
      this.isAdmin = true;
          //console.log('Header response; User role:', localStorage.getItem('Role'));
    }
  }

  toggleDropdownLang() {
    this.isOpen = !this.isOpen;
  }

  toggleDropdownUser() {
    this.isUserDropdownOpen = !this.isUserDropdownOpen;
    this.isOpen = false; // Close language dropdown if user dropdown is toggled
  }

  selectLanguage(lang: string) {
    this.selectedLanguage = lang;
    this.isOpen = false;
  }

  getLanguageLabel(lang: string): string {
    return lang === 'en' ? 'EN' : 'UA';
  }

  goToProfile() {
    this.isUserDropdownOpen = false;
    this.router.navigate(['/profile']);
  }

  logout() {
    this.isUserDropdownOpen = false;
    this.authService.logout();
    this.router.navigate(['/auth']);
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
      this.isUserDropdownOpen = false;
    } else if (this.isOpen && !(event.target as Element).closest('.language-dropdown')) {
      this.isOpen = false;
    } else if (this.isUserDropdownOpen && !(event.target as Element).closest('.user-info')) {
      this.isUserDropdownOpen = false;
    }
  }

}