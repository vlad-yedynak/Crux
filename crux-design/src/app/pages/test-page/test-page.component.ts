import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { HeaderComponent } from '../../components/header/header.component';

// Data model for card
interface Card {
  id: number;
  title: string;
  description: string;
  lessonId: number;
  type: string;
  content: string;
}

@Component({
  selector: 'app-test-page',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    HeaderComponent
  ],
  templateUrl: './test-page.component.html',
  styleUrl: './test-page.component.css'
})
export class TestPageComponent implements OnInit {
  card: Card | null = null;
  isLoading = true;
  hasError = false;
  errorMessage = '';

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Get the card ID from route params or state
    // For now, we'll assume it's stored in local storage as a fallback
    const cardId = localStorage.getItem('selectedCardId');
    
    if (cardId) {
      this.fetchCardDetails(parseInt(cardId, 10));
    } else {
      this.hasError = true;
      this.errorMessage = 'No card information available';
      this.isLoading = false;
    }
  }

  fetchCardDetails(cardId: number): void {
    const token = localStorage.getItem('auth-token'); 
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    this.http.get<{body: Card, success: boolean, error: string}>(`http://localhost:8080/lessons/get-card/${cardId}`, {headers}).subscribe({
      next: (response) => {
        console.log('Card details received:', response);
        
        if (response.success && response.body) {
          this.card = response.body;
        } else {
          this.hasError = true;
          this.errorMessage = response.error || 'Failed to load card details';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error(`Error fetching details for card ${cardId}:`, error);
        this.hasError = true;
        this.errorMessage = 'Failed to connect to the server';
        this.isLoading = false;
      }
    });
  }
}
