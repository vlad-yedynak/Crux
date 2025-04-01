import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common'; 


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule], 
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent{
    isDropdownVisible: boolean = false;

    toggleDropdown(): void {
        this.isDropdownVisible = !this.isDropdownVisible;
      }
}