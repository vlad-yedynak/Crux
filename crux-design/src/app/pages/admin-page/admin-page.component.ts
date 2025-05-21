import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

// Reuse the same interfaces from lessons page
interface Card {
  id: number;
  title: string;
  description: string;
  lessonId: number;
  type: string;
  content: string;
}

interface Lesson {
  id: number;
  title: string;
  cards: Card[];
}

interface LessonsResponse {
  body: Lesson[];
  success: boolean;
  error: string;
}

// Add test card interfaces
interface TestAnswer {
  answerText: string;
  score: number;
  isCorrect: boolean;
}

interface TestCardData {
  testCardId: number;
  questionText: string;
  answers: TestAnswer[];
}

// Add question list interface
interface TestQuestion {
  id?: number;
  testCardId: number;
  questionText: string;
  answers: TestAnswer[];
}

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule
  ],
  templateUrl: './admin-page.component.html',
  styleUrl: './admin-page.component.css'
})
export class AdminPageComponent implements OnInit {
  lessons: Lesson[] = [];
  isLoading = true;
  hasError = false;
  errorMessage = '';
  
  // Properties for cards popup
  selectedLesson: Lesson | null = null;
  isCardsPopupVisible = false;

  // Properties for add lesson popup
  isAddLessonPopupVisible = false;
  newLessonName = '';

  // Properties for add card popup
  isAddCardPopupVisible = false;
  currentLessonForCard: Lesson | null = null;
  newCard: Partial<Card> = {
    title: '',
    description: '',
    type: 'Educational',
    content: ''
  };
  
  // Properties for test card editing
  isEditTestCardPopupVisible = false;
  currentEditingCard: Card | null = null;
  testCardData: TestCardData = {
    testCardId: 0,
    questionText: '',
    answers: []
  };
  
  // Properties for test questions list
  isViewTestQuestionsPopupVisible = false;
  isLoadingQuestions = false;
  testQuestions: TestQuestion[] = [];
  currentQuestion: TestQuestion | null = null;
  
  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef  // Add ChangeDetectorRef
  ) {}
  
  ngOnInit(): void {
    // Initialize testCardData with empty answers array
    this.testCardData = {
      testCardId: 0,
      questionText: '',
      answers: [] // Always initialize with an empty array
    };
    
    this.fetchLessons();
  }
  
  fetchLessons(): Promise<void> {
    const token = localStorage.getItem('auth-token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    return new Promise<void>((resolve, reject) => {
      this.http.get<LessonsResponse>('http://localhost:8080/lessons/get-lessons', {headers}).subscribe({
        next: (response) => {
          if (response.success) {
            this.lessons = response.body;
            console.log('Admin: Lessons loaded:', this.lessons);
          } else {
            this.hasError = true;
            this.errorMessage = response.error || 'Failed to load lessons';
          }
          this.isLoading = false;
          resolve();
        },
        error: (error) => {
          console.error('Error fetching lessons in admin:', error);
          this.hasError = true;
          this.errorMessage = 'Failed to connect to the server';
          this.isLoading = false;
          reject(error);
        }
      });
    });
  }
  
  openAddLessonForm(): void {
    this.isAddLessonPopupVisible = true;
    this.newLessonName = '';
    // Prevent scrolling on the body when popup is open
    document.body.style.overflow = 'hidden';
  }
  
  closeAddLessonPopup(event: MouseEvent): void {
    // Only close if clicking the overlay or close button or cancel button
    if (
      (event.target as HTMLElement).classList.contains('add-lesson-popup-overlay') ||
      (event.target as HTMLElement).classList.contains('close-popup-btn') ||
      (event.target as HTMLElement).classList.contains('cancel-btn')
    ) {
      this.isAddLessonPopupVisible = false;
      // Re-enable scrolling on the body
      document.body.style.overflow = 'auto';
    }
  }
  
  editLesson(lesson: Lesson): void {
    console.log('Editing lesson:', lesson);
    // Implement edit lesson functionality
  }
  
  viewCards(lesson: Lesson): void {
    this.selectedLesson = lesson;
    this.isCardsPopupVisible = true;
    // Prevent scrolling on the body when popup is open
    document.body.style.overflow = 'hidden';
  }
  
  closeCardsPopup(event: MouseEvent): void {
    // Only close if clicking the overlay or close button
    if (
      (event.target as HTMLElement).classList.contains('cards-popup-overlay') ||
      (event.target as HTMLElement).classList.contains('close-popup-btn')
    ) {
      this.isCardsPopupVisible = false;
      this.selectedLesson = null;
      // Re-enable scrolling on the body
      document.body.style.overflow = 'auto';
    }
  }
  
  /**
   * Close popup when escape key is pressed
   */
  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    // Close any popup that is open
    if (this.isCardsPopupVisible) {
      this.isCardsPopupVisible = false;
      this.selectedLesson = null;
      document.body.style.overflow = 'auto';
    }
    
    if (this.isAddLessonPopupVisible) {
      this.isAddLessonPopupVisible = false;
      document.body.style.overflow = 'auto';
    }
    
    if (this.isAddCardPopupVisible) {
      this.isAddCardPopupVisible = false;
      this.currentLessonForCard = null;
      document.body.style.overflow = 'auto';
    }

    if (this.isEditTestCardPopupVisible) {
      this.isEditTestCardPopupVisible = false;
      this.currentEditingCard = null;
      document.body.style.overflow = 'auto';
    }

    if (this.isViewTestQuestionsPopupVisible) {
      this.isViewTestQuestionsPopupVisible = false;
      this.currentEditingCard = null;
      document.body.style.overflow = 'auto';
    }
  }
  
  createLesson(): void {
    if (!this.newLessonName.trim()) return;
    
    const token = localStorage.getItem('auth-token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    this.http.post('http://localhost:8080/lessons/create-lesson',
      JSON.stringify( this.newLessonName ),
      { headers }
    ).subscribe({
      next: (response: any) => {
        console.log('Lesson created:', response);
        // Close the popup
        this.isAddLessonPopupVisible = false;
        document.body.style.overflow = 'auto';
        // Refresh the lessons list
        this.fetchLessons();
      },
      error: (error) => {
        console.error('Error creating lesson:', error);
        alert('Failed to create lesson. Please try again.');
      }
    });
  }
  
  /**
   * Returns the CSS class for styling cards based on their type
   */
  getCardTypeClass(cardType: string): string {
    switch(cardType) {
      case 'Test':
        return 'test-card';
      case 'Sandbox':
        return 'sandbox-card';
      case 'Educational':
      default:
        return 'educational-card';
    }
  }
  
  // Handle edit card for different card types
  editCard(card: Card): void {
    console.log('Editing card:', card);
    
    if (card.type === 'Test') {
      this.editTestCard(card);
    } else {
      // Handle editing other card types (placeholder for now)
      console.log('Editing non-test card type:', card.type);
    }
  }
  
  // Modify the existing editTestCard to show the questions list instead
  editTestCard(card: Card): void {
    this.currentEditingCard = card;
    this.isViewTestQuestionsPopupVisible = true;
    document.body.style.overflow = 'hidden';
    this.isLoadingQuestions = true;
    this.testQuestions = []; // Clear existing questions
    
    // Use get-card/{id} endpoint to fetch the card data including questions
    const token = localStorage.getItem('auth-token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    this.http.get<any>(`http://localhost:8080/lessons/get-card/${card.id}`, { headers })
      .subscribe({
        next: (response) => {
          console.log('Raw test card data loaded:', response);
          
          if (response && response.success) {
            const cardData = response.body;
            console.log('Card content field:', cardData.content);
            
            // Create a sample question for testing if no questions are found
            if (!cardData.content || cardData.content.trim() === '') {
              console.log('No content found in card, creating sample question');
              this.testQuestions = [{
                testCardId: card.id,
                questionText: 'Sample question - create your own questions',
                answers: [
                  { answerText: 'Sample answer', score: 1, isCorrect: true }
                ]
              }];
            } else {
              // Try to parse the content field as JSON
              try {
                const parsedContent = JSON.parse(cardData.content);
                console.log('Parsed content:', parsedContent);
                
                // Check if the parsed content is an array
                if (Array.isArray(parsedContent)) {
                  this.testQuestions = parsedContent;
                } else if (typeof parsedContent === 'object') {
                  // If it's a single question object, wrap it in an array
                  this.testQuestions = [parsedContent];
                } else {
                  console.warn('Content is not in expected format, creating sample question');
                  this.testQuestions = [{
                    testCardId: card.id,
                    questionText: 'Sample question - create your own questions',
                    answers: [
                      { answerText: 'Sample answer', score: 1, isCorrect: true }
                    ]
                  }];
                }
              } catch (error) {
                console.error('Error parsing questions from content:', error);
                
                // If parsing fails, create a sample question
                this.testQuestions = [{
                  testCardId: card.id,
                  questionText: 'Sample question - create your own questions',
                  answers: [
                    { answerText: 'Sample answer', score: 1, isCorrect: true }
                  ]
                }];
              }
            }
          }
          
          console.log('Final questions list:', this.testQuestions);
          this.isLoadingQuestions = false;
          this.cdr.detectChanges(); // Force UI update
        },
        error: (error) => {
          console.error('Error fetching test card data:', error);
          // Create a sample question on error
          this.testQuestions = [{
            testCardId: card.id,
            questionText: 'Sample question - create your own questions',
            answers: [
              { answerText: 'Sample answer', score: 1, isCorrect: true }
            ]
          }];
          this.isLoadingQuestions = false;
          this.cdr.detectChanges(); // Force UI update
        }
      });
  }
  
  closeViewTestQuestionsPopup(event: MouseEvent): void {
    if (
      (event.target as HTMLElement).classList.contains('view-test-questions-overlay') ||
      (event.target as HTMLElement).classList.contains('close-popup-btn')
    ) {
      this.isViewTestQuestionsPopupVisible = false;
      this.currentEditingCard = null;
      document.body.style.overflow = 'auto';
    }
  }
  
  // Method to edit an existing question
  editQuestion(question: TestQuestion): void {
    // Populate the form with the question data
    this.testCardData = {
      testCardId: this.currentEditingCard!.id,
      questionText: question.questionText,
      answers: [...question.answers] // Create a copy to avoid reference issues
    };
    
    // Hide the questions list popup and show the question editor
    this.isViewTestQuestionsPopupVisible = false;
    this.isEditTestCardPopupVisible = true;
    this.currentQuestion = question;
    this.cdr.detectChanges();
  }
  
  // Method to add a new question
  addNewQuestion(): void {
    // Initialize with empty data
    this.testCardData = {
      testCardId: this.currentEditingCard!.id,
      questionText: '',
      answers: [this.createEmptyAnswer()]
    };
    
    // Hide the questions list popup and show the question editor
    this.isViewTestQuestionsPopupVisible = false;
    this.isEditTestCardPopupVisible = true;
    this.currentQuestion = null; // Null means we're adding a new question
    this.cdr.detectChanges();
  }
  
  // Method to delete a question
  deleteQuestion(question: TestQuestion, index: number): void {
    if (confirm(`Are you sure you want to delete Question #${index+1}? This action cannot be undone.`)) {
      const token = localStorage.getItem('auth-token');
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
      
      this.http.delete(`http://localhost:8080/lessons/delete-question/${question.id}`, { headers })
        .subscribe({
          next: (response: any) => {
            console.log('Question deleted:', response);
            // Remove from the local array
            this.testQuestions.splice(index, 1);
          },
          error: (error) => {
            console.error('Error deleting question:', error);
            alert('Failed to delete question. Please try again.');
          }
        });
    }
  }
  
  createEmptyAnswer(): TestAnswer {
    return {
      answerText: '',
      score: 0,
      isCorrect: false
    };
  }
  
  addAnswer(): void {
    console.log('Adding new answer');
    
    // Ensure testCardData exists
    if (!this.testCardData) {
      this.testCardData = {
        testCardId: this.currentEditingCard?.id || 0,
        questionText: '',
        answers: []
      };
    }
    
    // Ensure answers array exists
    if (!this.testCardData.answers) {
      this.testCardData.answers = [];
    }
    
    // Now safely add the new answer
    this.testCardData.answers.push(this.createEmptyAnswer());
    console.log('Answer added, current answers:', this.testCardData.answers);
    this.cdr.detectChanges();
  }
  
  removeAnswer(index: number): void {
    if (this.testCardData.answers.length > 1) {
      const wasCorrect = this.testCardData.answers[index].isCorrect;
      this.testCardData.answers.splice(index, 1);
      
      // If we removed the correct answer, set the first answer as correct
      if (wasCorrect && this.testCardData.answers.length > 0) {
        this.setCorrectAnswer(0);
      }
    } else {
      alert('Test must have at least one answer option.');
    }
  }
  
  setCorrectAnswer(index: number): void {
    // First set all answers to not correct and score to 0
    this.testCardData.answers.forEach((answer, i) => {
      answer.isCorrect = (i === index);
      answer.score = answer.isCorrect ? 1 : 0;
    });
    
    console.log('Set correct answer to index:', index, this.testCardData.answers);
  }
  
  isTestCardFormValid(): boolean {
    // Safe check for questionText to prevent "Cannot read properties of undefined" error
    if (!this.testCardData || !this.testCardData.questionText || !this.testCardData.questionText.trim()) {
      return false;
    }
    
    // Check if at least one answer exists
    if (!this.testCardData.answers || this.testCardData.answers.length === 0) {
      return false;
    }
    
    // Check each answer for validity
    for (const answer of this.testCardData.answers) {
      if (!answer || !answer.answerText || !answer.answerText.trim()) {
        return false;
      }
    }
    
    // Check if at least one answer is marked as correct
    if (!this.testCardData.answers.some(answer => answer && answer.isCorrect)) {
      return false;
    }
    
    return true;
  }
  
  // Modify the saveTestCard method to handle both edit and create
  saveTestCard(): void {
    if (!this.isTestCardFormValid() || !this.currentEditingCard) return;
    
    const token = localStorage.getItem('auth-token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    // Ensure testCardId is explicitly set to the card ID
    const questionData = {
      testCardId: this.currentEditingCard.id,
      questionText: this.testCardData.questionText,
      answers: this.testCardData.answers.map(answer => ({
        answerText: answer.answerText,
        score: answer.score,
        isCorrect: answer.isCorrect
      }))
    };
    
    // Debug: Log the formatted question data being sent
    console.log('Sending question data:', JSON.stringify(questionData, null, 2));
    
    // Send the properly formatted data to the API
    this.http.post('http://localhost:8080/lessons/create-question', 
      questionData, 
      { headers }
    ).subscribe({
      next: (response: any) => {
        console.log('Test question saved:', response);
        
        // Close the edit popup
        this.isEditTestCardPopupVisible = false;
        
        // Reopen the questions list popup but fetch updated card data
        this.isViewTestQuestionsPopupVisible = true;
        this.isLoadingQuestions = true;
        
        // Fetch the updated card data with questions
        this.http.get<any>(`http://localhost:8080/lessons/get-card/${this.currentEditingCard!.id}`, { headers })
          .subscribe({
            next: (cardResponse) => {
              if (cardResponse && cardResponse.success) {
                const cardData = cardResponse.body;
                
                // Parse the content field to extract questions
                try {
                  if (cardData.content) {
                    this.testQuestions = JSON.parse(cardData.content);
                  } else {
                    this.testQuestions = [];
                  }
                } catch (error) {
                  console.error('Error parsing questions from content:', error);
                  this.testQuestions = [];
                }
              }
              this.isLoadingQuestions = false;
            },
            error: (error) => {
              console.error('Error fetching updated card data:', error);
              this.isLoadingQuestions = false;
            }
          });
      },
      error: (error) => {
        console.error('Error saving test question:', error);
        alert('Failed to save test question. Please try again.');
      }
    });
  }
  
  closeEditTestCardPopup(event: MouseEvent): void {
    if (
      (event.target as HTMLElement).classList.contains('edit-test-card-popup-overlay') ||
      (event.target as HTMLElement).classList.contains('close-popup-btn') ||
      (event.target as HTMLElement).classList.contains('cancel-btn')
    ) {
      this.isEditTestCardPopupVisible = false;
      
      // If we came from the questions list, go back to it
      if (this.currentEditingCard) {
        this.isViewTestQuestionsPopupVisible = true;
      } else {
        // Otherwise just close everything
        this.currentEditingCard = null;
        document.body.style.overflow = 'auto';
      }
    }
  }
  
  // Placeholder methods for card management
  deleteCard(card: Card): void {
    if (confirm(`Are you sure you want to delete the card "${card.title}"? This action cannot be undone.`)) {
      console.log('Deleting card:', card);
      // Implement delete card functionality with API call
    }
  }
  
  addCardToLesson(lesson: Lesson): void {
    console.log('Adding card to lesson:', lesson);
    
    // Store lesson for card creation
    this.currentLessonForCard = lesson;
    
    // Close the cards popup first
    if (this.isCardsPopupVisible) {
      this.isCardsPopupVisible = false;
      this.selectedLesson = null;
    }
    
    // Reset before opening to ensure clean state
    this.resetNewCardForm();
    
    // Set flag to show popup
    this.isAddCardPopupVisible = true;
    
    // Force change detection to update the view
    this.cdr.detectChanges();
    
    console.log('Card popup state:', {
      isCardPopupVisible: this.isAddCardPopupVisible,
      currentLesson: this.currentLessonForCard?.title
    });
    
    // Prevent scrolling on the body when popup is open
    document.body.style.overflow = 'hidden';
  }
  
  closeAddCardPopup(event: MouseEvent): void {
    // Only close if clicking the overlay or close button or cancel button
    if (
      (event.target as HTMLElement).classList.contains('add-card-popup-overlay') ||
      (event.target as HTMLElement).classList.contains('close-popup-btn') ||
      (event.target as HTMLElement).classList.contains('cancel-btn')
    ) {
      this.isAddCardPopupVisible = false;
      this.currentLessonForCard = null;
      // Re-enable scrolling on the body
      document.body.style.overflow = 'auto';
    }
  }
  
  resetNewCardForm(): void {
    this.newCard = {
      title: '',
      description: '',
      type: 'Educational',
      content: ''
    };
  }
  
  isCardFormValid(): boolean {
    return Boolean(
      this.newCard.title && 
      this.newCard.title.trim() && 
      this.newCard.description && 
      this.newCard.description.trim() &&
      this.newCard.type
    );
  }
  
  createCard(): void {
    if (!this.isCardFormValid() || !this.currentLessonForCard) return;
    
    const token = localStorage.getItem('auth-token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    // Update the payload to match the expected API format
    const cardData = {
      title: this.newCard.title!.trim(),
      description: this.newCard.description!.trim(),
      cardType: this.newCard.type,  // Changed from 'type' to 'cardType'
      lessonId: this.currentLessonForCard.id
      // Removed 'content' field as it's not needed in the request
    };
    
    this.http.post('http://localhost:8080/lessons/create-card', 
      cardData, 
      { headers }
    ).subscribe({
      next: (response: any) => {
        console.log('Card created:', response);
        
        // Close the add card popup
        this.isAddCardPopupVisible = false;
        
        // Refresh lessons data
        this.fetchLessons().then(() => {
          // After refreshing lessons, reopen the cards popup for the current lesson
          const updatedLesson = this.lessons.find(l => l.id === this.currentLessonForCard!.id);
          if (updatedLesson) {
            this.viewCards(updatedLesson);
          }
          this.currentLessonForCard = null;
        });
      },
      error: (error) => {
        console.error('Error creating card:', error);
        alert('Failed to create card. Please try again.');
      }
    });
  }
  
  deleteLesson(lesson: Lesson): void {
    if (confirm(`Are you sure you want to delete "${lesson.title}"? This action cannot be undone.`)) {
      console.log('Deleting lesson:', lesson);
      // Implement delete functionality with API call
    }
  }
}
