import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../components/header/header.component';

@Component({
  selector: 'app-main-layout',
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent {

}
