import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { NavigationComponent } from "./components/navigation/navigation.component";
import { MainContentComponent } from "./components/main-content/main-content.component";
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
//import { RouterOutlet } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [
    RouterModule,
    HeaderComponent, 
    NgbModule,
  ],
  // template: `
      
  // `,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent {
  title = 'crux-design';
}
