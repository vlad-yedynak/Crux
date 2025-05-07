import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Data model for card
interface Answer {
  answerText: string;
  error: string | null;
  id: number;
  score: number;
  success: boolean;
}

interface Question {
  answers: Answer[];
  questionText?: string;
  id?: number;
}

interface CardBody {
  questions: Question[];
}

interface Card {
  id: number;
  title: string;
  description: string;
  lessonId: number;
  type: string;
  content: string;
  body?: CardBody;
}

// Answer submission format
interface AnswerSubmission {
  questionId: number;
  answerId: number;
}

interface ValidationResponse {
  body: boolean;     // true if answer is correct, false otherwise
  success: boolean;  // true if validation request succeeded
  error: string | null; // error message if any
}

@Component({
  selector: 'app-test-page',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule
  ],
  templateUrl: './test-page.component.html',
  styleUrl: './test-page.component.css'
})
export class TestPageComponent implements OnInit {
  card: Card | null = null;
  isLoading = true;
  hasError = false;
  errorMessage = '';

  questions: Question[] = [];
  
  // Store user answers in the required format
  userAnswers: AnswerSubmission[] = [];
  
  // Add the missing properties
  questionResults: {[questionId: number]: boolean} = {};
  testSubmitted = false;
  correctAnswersCount = 0;

  // Add property to track showing results popup
  showResultsPopup = false;
  allQuestionsProcessed = false;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
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
    
    this.http.get<{body: any, success: boolean, error: string}>(`http://localhost:8080/lessons/get-card/${cardId}`, {headers}).subscribe({
      next: (response) => {
        console.log('Card details received:', response);
        
        if (response.success && response.body) {
          this.card = response.body as Card;
          
          if (response.body.questions && Array.isArray(response.body.questions)) {
            this.questions = response.body.questions;
            console.log('Questions found directly in body:', this.questions);
          } 
          else if (response.body.body && response.body.body.questions && Array.isArray(response.body.body.questions)) {
            this.questions = response.body.body.questions;
            console.log('Questions found in nested body:', this.questions);
          }
          if (this.questions.length === 0) {
            console.log('Could not find questions array in response. Full response structure:', JSON.stringify(response.body));
          }
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

  // Add method to handle answer selection
  selectAnswer(questionId: number | undefined, answerId: number | undefined): void {
    // Handle potential undefined values
    if (questionId === undefined || answerId === undefined) {
      console.error('Question ID or Answer ID is undefined');
      return;
    }
    
    // Check if an answer for this question already exists
    const existingIndex = this.userAnswers.findIndex(a => a.questionId === questionId);
    
    if (existingIndex !== -1) {
      // Update existing answer
      this.userAnswers[existingIndex].answerId = answerId;
    } else {
      // Add new answer
      this.userAnswers.push({ questionId, answerId });
    }
    
    console.log('Current answers:', this.userAnswers);
  }
  
  // Add the missing methods
  hasAllAnswers(): boolean {
    if (!this.questions || this.questions.length === 0) return false;
    
    // Check if we have an answer for each question that has an ID
    return this.questions.every(q => q.id !== undefined && 
      this.userAnswers.some(a => a.questionId === q.id));
  }
  
  submitTest(): void {
    if (!this.hasAllAnswers()) {
      alert('Please answer all questions before submitting.');
      return;
    }
    
    this.testSubmitted = true;
    
    // Reset values for a new submission
    this.showResultsPopup = false;
    this.allQuestionsProcessed = false;
    this.correctAnswersCount = 0;
    
    const token = localStorage.getItem('auth-token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    // Track how many questions have been processed
    let processedCount = 0;
    
    // Validate each answer
    this.userAnswers.forEach(answer => {
      this.http.post<ValidationResponse>('http://localhost:8080/testing/validate-question', answer, {headers})
        .subscribe({
          next: (result) => {
            if (result.success) {
              // Store the validation result (true/false)
              this.questionResults[answer.questionId] = result.body;
              
              if (result.body) {
                this.correctAnswersCount++;
              }
              
              console.log(`Answer for question ${answer.questionId} is ${result.body ? 'correct' : 'incorrect'}`);
            } else {
              console.error(`Validation failed for question ${answer.questionId}: ${result.error}`);
              // Set as incorrect if validation fails
              this.questionResults[answer.questionId] = false;
            }
            
            // Check if all questions have been processed
            processedCount++;
            if (processedCount === this.userAnswers.length) {
              this.allQuestionsProcessed = true;
              this.showResultsPopup = true;
            }
          },
          error: (error) => {
            console.error(`Error validating answer for question ${answer.questionId}:`, error);
            // Set as incorrect if validation fails
            this.questionResults[answer.questionId] = false;
            
            // Still count this as processed
            processedCount++;
            if (processedCount === this.userAnswers.length) {
              this.allQuestionsProcessed = true;
              this.showResultsPopup = true;
            }
          }
        });
    });
  }
  
  restartTest(): void {
    this.testSubmitted = false;
    this.userAnswers = [];
    this.questionResults = {};
    this.correctAnswersCount = 0;
    this.showResultsPopup = false;
  }
  
  returnToLessons(): void {
    this.router.navigate(['/lessons']);
  }
  
  closeResultsPopup(): void {
    this.showResultsPopup = false;
  }
}
