import { Component, HostListener } from '@angular/core';
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
      state('hidden', style({
        opacity: 0,
        transform: 'translateY(-10px) scale(0.95)',
        visibility: 'hidden'
      })),
      state('visible', style({
        opacity: 1,
        transform: 'translateY(0) scale(1)',
        visibility: 'visible'
      })),
      transition('hidden => visible', [
        animate('300ms ease-out')
      ]),
      transition('visible => hidden', [
        animate('300ms ease-in')
      ])
    ])
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent{
    isDropdownVisible: boolean = false;

    toggleDropdown(): void {
        this.isDropdownVisible = !this.isDropdownVisible;
      }
}