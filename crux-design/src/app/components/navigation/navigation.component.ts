import { Component } from '@angular/core';
import { CommonModule } from "@angular/common";

@Component({
  selector: 'app-navigation',
  imports: [CommonModule],
  template: `
    <nav class="tab-navigation">
        <ul class="tabs">
            <li class="tab-item"><a href="#lessons">Lessons</a></li>
            <li class="tab-item"><a href="#materials">Materials</a></li>
            <li class="tab-item"><a href="#other">Other</a></li>
        </ul>
    </nav>
  `,
  styleUrl: './navigation.component.css'
})
export class NavigationComponent {

}
