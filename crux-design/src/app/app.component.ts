import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthServiceService } from './auth/services/auth-service.service';
//import { RouterOutlet } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [
    RouterModule,
    NgbModule,
  ],
  // template: `
      
  // `,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent implements OnInit{
  title = 'crux-design';

  constructor(private authService: AuthServiceService) {}

  ngOnInit(): void {
    this.authService.fetchAndSetUser();
  }
}
