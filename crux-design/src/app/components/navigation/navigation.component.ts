import { Component } from '@angular/core';
import { CommonModule } from "@angular/common";
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
        </ul>
    </nav>
  `,
  styleUrl: './navigation.component.css'
})
export class NavigationComponent {

}
