import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthServiceService } from './services/auth-service.service';
import { LessonsService } from './services/lessons.service';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [
    RouterModule,
    NgbModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent implements OnInit{
  title = 'crux-design';

  constructor(
    private authService: AuthServiceService,
    private lessonsService: LessonsService
  ) {}

  ngOnInit(): void {
    this.authService.fetchAndSetUser();
    
    this.lessonsService.initializeData().subscribe({
      next: (lessons) => {
        //console.log('App: Lessons initialized successfully', lessons?.length || 0);
      },
      error: (err) => {
        //console.error('App: Error initializing lessons', err);
      }
    });
  }
}
