import { Component } from '@angular/core';
import { HeaderComponent } from './components/header/header.component';
import { NavigationComponent } from "./components/navigation/navigation.component";
import { MainContentComponent } from "./components/main-content/main-content.component";
//import { RouterOutlet } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [HeaderComponent, NavigationComponent, MainContentComponent],
  // template: `
      
  // `,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent {
  title = 'crux-design';
}
