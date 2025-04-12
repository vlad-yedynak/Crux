import { Component, ElementRef, HostListener } from '@angular/core';
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
import { RouterModule } from '@angular/router';
import { Console } from 'console';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    NgbDropdownModule,
    RouterModule,
    NavigationComponent
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
export class HeaderComponent{
  isOpen = false;
  selectedLanguage = 'en';


  constructor(private eRef: ElementRef) {}

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  selectLanguage(lang: string) {
    this.selectedLanguage = lang;
    this.isOpen = false;
  }

  getLanguageLabel(lang: string): string {
    return lang === 'en' ? 'EN' : 'UA';
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    if (this.isOpen && !this.eRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }
}