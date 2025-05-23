import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { SanitizeHtmlPipe } from '../../pipes/sanitize-html.pipe';

// Reuse the same interfaces from lessons page
interface Card {
  id: number;
  title: string;
  description: string;
  lessonId: number;
  type: string;
  content: string;
}

// Update the TestAnswer interface to make isCorrect required (not optional)
interface TestAnswer {
  id?: number;
  answerText: string;
  score: number;
  isCorrect: boolean; // Remove the optional marker (?)
  success?: boolean;
  error?: string | null;
}

// Update the TestQuestion interface to match API response
interface TestQuestion {
  id?: number;
  questionText: string;
  answers: TestAnswer[];
  isCompleted?: boolean;
  success?: boolean;
  error?: string | null;
}

// Update TestCardData interface to match the API expectations
interface TestCardData {
  testCardId: number; // Will change usage but keeping interface for compatibility
  questionText: string;
  answers: TestAnswer[];
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

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    SanitizeHtmlPipe
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
  
  // Add properties for popup titles
  questionPopupTitle = '';
  questionPopupSubmitText = '';
  
  // Properties for test questions list
  isViewTestQuestionsPopupVisible = false;
  isLoadingQuestions = false;
  testQuestions: TestQuestion[] = [];
  currentQuestion: TestQuestion | null = null;
  
  // Properties for edit lesson popup
  isEditLessonPopupVisible = false;
  currentEditingLesson: Lesson | null = null;
  editedLessonName = '';

  // Add property for edit card popup
  isEditCardPopupVisible = false;
  cardBeingEdited: Card | null = null;
  editedCardData: Partial<Card> = {
    title: '',
    description: ''
  };
  
  // Add properties for educational content
  isViewEducationalContentPopupVisible = false;
  isLoadingEducationalContent = false;
  educationalContent: string = '';
  educationalImages: { url: string; caption: string; altText: string }[] = [];
  educationalAttachments: { url: string; description: string }[] = [];
  hasExistingContent = false;
  
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
      this.http.get<LessonsResponse>('http://localhost:8080/lesson/get-lessons', {headers}).subscribe({
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
    this.currentEditingLesson = lesson;
    this.editedLessonName = lesson.title;
    this.isEditLessonPopupVisible = true;
    // Prevent scrolling on the body when popup is open
    document.body.style.overflow = 'hidden';
  }
  
  closeEditLessonPopup(event: MouseEvent): void {
    // Only close if clicking the overlay or close button or cancel button
    if (
      (event.target as HTMLElement).classList.contains('edit-lesson-popup-overlay') ||
      (event.target as HTMLElement).classList.contains('close-popup-btn') ||
      (event.target as HTMLElement).classList.contains('cancel-btn')
    ) {
      this.isEditLessonPopupVisible = false;
      this.currentEditingLesson = null;
      // Re-enable scrolling on the body
      document.body.style.overflow = 'auto';
    }
  }
  
  saveEditedLesson(): void {
    if (!this.editedLessonName.trim() || !this.currentEditingLesson) return;
    
    const token = localStorage.getItem('auth-token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    const lessonData = {
      id: this.currentEditingLesson.id,
      title: this.editedLessonName.trim()
    };
    
    this.http.put('http://localhost:8080/lesson/update-lesson', 
      lessonData,
      { headers }
    ).subscribe({
      next: (response: any) => {
        console.log('Lesson updated:', response);
        
        // Close the edit popup
        this.isEditLessonPopupVisible = false;
        document.body.style.overflow = 'auto';
        this.currentEditingLesson = null;
        
        // Refresh lessons data
        this.fetchLessons();
      },
      error: (error) => {
        console.error('Error updating lesson:', error);
        alert('Failed to update lesson. Please try again.');
      }
    });
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
    
    if (this.isEditLessonPopupVisible) {
      this.isEditLessonPopupVisible = false;
      this.currentEditingLesson = null;
      document.body.style.overflow = 'auto';
    }

    if (this.isEditCardPopupVisible) {
      this.isEditCardPopupVisible = false;
      this.cardBeingEdited = null;
      document.body.style.overflow = 'auto';
    }

    if (this.isViewEducationalContentPopupVisible) {
      this.isViewEducationalContentPopupVisible = false;
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
    
    this.http.post('http://localhost:8080/lesson/create-lesson',
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
    
    // Show the edit card popup first
    this.cardBeingEdited = card;
    this.editedCardData = {
      title: card.title,
      description: card.description,
      type: card.type
    };
    
    // Set appropriate title based on card type
    if (card.type === 'Educational') {
      this.questionPopupTitle = 'Edit Card';
    } else if (card.type === 'Test') {
      this.questionPopupTitle = 'Edit Test Card';
    } else {
      this.questionPopupTitle = 'Edit Card';
    }
    
    this.isEditCardPopupVisible = true;
    document.body.style.overflow = 'hidden';
  }

  // Method to edit educational content - update to ensure proper content loading
  editEducationalData(card: Card): void {
    console.log('Editing educational data for card:', card);
    
    // Close the card popup
    this.isEditCardPopupVisible = false;
    
    // Open the educational content popup
    this.currentEditingCard = card;
    this.isViewEducationalContentPopupVisible = true;
    document.body.style.overflow = 'hidden';
    this.isLoadingEducationalContent = true;
    this.educationalContent = ''; // Clear existing content
    this.educationalImages = []; // Clear existing images
    this.educationalAttachments = []; // Clear existing attachments
    this.hasExistingContent = false;
    
    // Fetch the card data
    const token = localStorage.getItem('auth-token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    this.http.get<any>(`http://localhost:8080/card/get-card/${card.id}`, { headers })
      .subscribe({
        next: (response) => {
          console.log('Educational card data loaded:', response);
          
          if (response && response.success) {
            const cardData = response.body;
            this.hasExistingContent = Boolean(cardData.content);
            
            // Try to extract the content with improved parsing logic
            try {
              if (cardData.content) {
                // If content is a string that contains JSON
                if (typeof cardData.content === 'string') {
                  try {
                    const parsedContent = JSON.parse(cardData.content);
                    this.educationalContent = parsedContent.content || '';
                    
                    // Check for images and attachments
                    if (parsedContent.images && Array.isArray(parsedContent.images)) {
                      this.educationalImages = parsedContent.images;
                    }
                    if (parsedContent.attachments && Array.isArray(parsedContent.attachments)) {
                      this.educationalAttachments = parsedContent.attachments;
                    }
                  } catch {
                    // If it's not valid JSON, use as-is (might be direct HTML)
                    this.educationalContent = cardData.content;
                  }
                } 
                // If content is already an object
                else if (typeof cardData.content === 'object') {
                  this.educationalContent = cardData.content.content || 
                                           (cardData.content.toString ? cardData.content.toString() : '');
                  
                  // Check for images and attachments
                  if (cardData.content.images && Array.isArray(cardData.content.images)) {
                    this.educationalImages = cardData.content.images;
                  }
                  if (cardData.content.attachments && Array.isArray(cardData.content.attachments)) {
                    this.educationalAttachments = cardData.content.attachments;
                  }
                }
              }
            } catch (error) {
              console.error('Error parsing educational content:', error);
              this.educationalContent = cardData.content || '';
            }
          }
          
          console.log('Educational content loaded:', this.educationalContent);
          this.isLoadingEducationalContent = false;
          this.cdr.detectChanges(); // Force UI update
        },
        error: (error) => {
          console.error('Error fetching educational card data:', error);
          this.educationalContent = 'Error loading content. Please try again.';
          this.isLoadingEducationalContent = false;
          this.cdr.detectChanges(); // Force UI update
        }
      });
  }
  
  // Add these helper methods for the HTML editor
  insertBold(): void {
    this.insertHtmlTag('<strong>', '</strong>');
  }
  
  insertItalic(): void {
    this.insertHtmlTag('<em>', '</em>');
  }
  
  insertHeader(level: number): void {
    this.insertHtmlTag(`<h${level}>`, `</h${level}>`);
  }
  
  insertLink(): void {
    const url = prompt('Enter the URL:') || 'https://example.com';
    const text = prompt('Enter the link text:') || url;
    this.insertHtmlTag(`<a href="${url}" target="_blank">`, `${text}</a>`);
  }
  
  insertImage(): void {
    const url = prompt('Enter the image URL:') || '';
    if (url) {
      const alt = prompt('Enter alt text:') || 'Image';
      this.insertHtmlTag(`<img src="${url}" alt="${alt}" style="max-width:100%;" />`, '');
    }
  }
  
  // Method to close educational content popup
  closeEducationalContentPopup(event: MouseEvent): void {
    if (
      (event.target as HTMLElement).classList.contains('view-educational-content-overlay') ||
      (event.target as HTMLElement).classList.contains('close-popup-btn')
    ) {
      this.isViewEducationalContentPopupVisible = false;
      this.currentEditingCard = null;
      document.body.style.overflow = 'auto';
    }
  }

  // Modified to match the expected API format for add-educational-data
  saveEducationalContent(): void {
    if (!this.currentEditingCard) return;
    
    const token = localStorage.getItem('auth-token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    // Format data according to the API's expected structure
    const educationalData = {
      cardId: this.currentEditingCard.id,
      content: this.educationalContent,
      images: this.educationalImages,
      attachments: this.educationalAttachments
    };
    
    console.log('Sending educational content with payload:', JSON.stringify(educationalData, null, 2));
    
    this.http.post('http://localhost:8080/card/add-educational-data', 
      educationalData, 
      { headers }
    ).subscribe({
      next: (response: any) => {
        console.log('Educational content updated:', response);
        
        // Close the content popup
        this.isViewEducationalContentPopupVisible = false;
        document.body.style.overflow = 'auto';
        
        // Refresh lessons data
        this.fetchLessons();
        this.currentEditingCard = null;
      },
      error: (error) => {
        console.error('Error updating educational content:', error);
        alert('Failed to update educational content. Please try again.');
      }
    });
  }
  
  // Add methods for rich text editing
  insertHtmlTag(openTag: string, closeTag: string): void {
    const textarea = document.querySelector('.html-editor') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = this.educationalContent.substring(start, end);
    const beforeText = this.educationalContent.substring(0, start);
    const afterText = this.educationalContent.substring(end);
    
    this.educationalContent = beforeText + openTag + selectedText + closeTag + afterText;
    
    // Set the cursor position after this operation
    setTimeout(() => {
      textarea.focus();
      if (selectedText.length > 0) {
        // If text was selected, put cursor after the inserted tags
        textarea.selectionStart = start + openTag.length + selectedText.length + closeTag.length;
        textarea.selectionEnd = start + openTag.length + selectedText.length + closeTag.length;
      } else {
        // If no text was selected, put cursor between tags
        textarea.selectionStart = start + openTag.length;
        textarea.selectionEnd = start + openTag.length;
      }
    }, 0);
  }
  
  onContentChange(): void {
    // This method will be triggered when content changes
    // You could add additional functionality here if needed
    this.cdr.detectChanges();
  }

  editTestCard(card: Card): void {
    this.currentEditingCard = card;
    this.isViewTestQuestionsPopupVisible = true;
    document.body.style.overflow = 'hidden';
    this.isLoadingQuestions = true;
    this.testQuestions = []; // Clear existing questions
    
    const token = localStorage.getItem('auth-token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    this.http.get<any>(`http://localhost:8080/card/get-card/${card.id}`, { headers })
      .subscribe({
        next: (response) => {
          console.log('Raw test card data loaded:', response);
          
          if (response && response.success) {
            const cardData = response.body;
            console.log('Card data:', cardData);
            
            // If questions are in the response directly
            if (cardData.questions && Array.isArray(cardData.questions)) {
              // Process questions to ensure isCorrect is set based on score
              this.testQuestions = cardData.questions.map((question: any) => ({
                ...question,
                answers: question.answers.map((answer: any) => ({
                  ...answer,
                  // Set isCorrect based on score - any score of 1 is considered correct
                  isCorrect: answer.score === 1
                }))
              }));
              console.log('Questions loaded directly from response:', this.testQuestions);
            } 
            // If no questions or couldn't parse, create a sample question
            else {
              console.log('No questions found, creating sample question');
              this.testQuestions = [{
                questionText: 'Sample question - create your own questions',
                answers: [
                  { answerText: 'Sample answer', score: 1, isCorrect: true }
                ]
              }];
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
    // Set appropriate titles for editing
    this.questionPopupTitle = 'Edit Question';
    this.questionPopupSubmitText = 'Save Changes';
    
    // Populate the form with the question data
    this.testCardData = {
      testCardId: this.currentEditingCard!.id, // We'll use this internally
      questionText: question.questionText,
      answers: question.answers.map(answer => ({
        ...answer,
        isCorrect: answer.score === 1, // Ensure isCorrect is set based on score
      }))
    };
    
    // Hide the questions list popup and show the question editor
    this.isViewTestQuestionsPopupVisible = false;
    this.isEditTestCardPopupVisible = true;
    this.currentQuestion = question;
    this.cdr.detectChanges();
  }
  
  // Method to add a new question
  addNewQuestion(): void {
    // Set appropriate titles for adding
    this.questionPopupTitle = 'Add New Question';
    this.questionPopupSubmitText = 'Create Question';
    
    // Initialize with empty data
    this.testCardData = {
      testCardId: this.currentEditingCard!.id, // We'll use this internally 
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
      
      this.http.delete(`http://localhost:8080/question/delete-question/${question.id}`, { headers })
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
      isCorrect: false // Initialize isCorrect as false
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
      const wasCorrect = this.testCardData.answers[index].score === 1;
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
    // Update all answers to set the score appropriately
    this.testCardData.answers.forEach((answer, i) => {
      answer.score = (i === index) ? 1 : 0;
      answer.isCorrect = (i === index); // Also update isCorrect for template compatibility
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
    
    // Check if at least one answer has a score of 1 (is correct)
    if (!this.testCardData.answers.some(answer => answer && answer.score === 1)) {
      return false;
    }
    
    return true;
  }
  
  saveTestCard(): void {
    if (!this.isTestCardFormValid() || !this.currentEditingCard) return;
    
    // Ensure isCorrect and score are in sync before saving
    this.testCardData.answers.forEach(answer => {
      // Make sure isCorrect is set based on score
      answer.isCorrect = answer.score === 1;
    });
    
    const token = localStorage.getItem('auth-token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    // Determine if we're updating an existing question or creating a new one
    const isUpdating = this.currentQuestion !== null && this.currentQuestion.id !== undefined;
    
    // Format question data according to the API's expected structure
    const questionData = {
      // Include the question ID only if updating an existing question
      ...(isUpdating ? { id: this.currentQuestion!.id } : {}),
      testCardId: this.currentEditingCard.id, // Change from testCardId to cardId
      questionText: this.testCardData.questionText,
      answers: this.testCardData.answers.map(answer => ({
        // Include the answer ID if it exists
        ...(answer.id ? { id: answer.id } : {}),
        answerText: answer.answerText,
        score: answer.score,
        isCorrect: answer.isCorrect
      }))
    };
    
    // Debug: Log the formatted question data being sent
    console.log(`${isUpdating ? 'Updating' : 'Creating'} question:`, JSON.stringify(questionData, null, 2));
    
    // Choose the appropriate endpoint and HTTP method based on whether we're updating or creating
    const endpoint = isUpdating 
      ? 'http://localhost:8080/question/update-question'
      : 'http://localhost:8080/question/create-question';
    
    const request = isUpdating
      ? this.http.put(endpoint, questionData, { headers })
      : this.http.post(endpoint, questionData, { headers });
    
    // Send the request
    request.subscribe({
      next: (response: any) => {
        console.log(`Question ${isUpdating ? 'updated' : 'created'}:`, response);
        
        // Close the edit popup
        this.isEditTestCardPopupVisible = false;
        
        // Reopen the questions list popup but fetch updated card data
        this.isViewTestQuestionsPopupVisible = true;
        this.isLoadingQuestions = true;
        
        // Fetch the updated card data with questions
        this.http.get<any>(`http://localhost:8080/card/get-card/${this.currentEditingCard!.id}`, { headers })
          .subscribe({
            next: (cardResponse) => {
              if (cardResponse && cardResponse.success) {
                const cardData = cardResponse.body;
                
                // If questions are available directly, use them
                if (cardData.questions && Array.isArray(cardData.questions)) {
                  this.testQuestions = cardData.questions.map((question: any) => ({
                    ...question,
                    answers: question.answers.map((answer: any) => ({
                      ...answer,
                      isCorrect: answer.score === 1
                    }))
                  }));
                }
                // Otherwise try to parse the content field
                else {
                  try {
                    if (cardData.content) {
                      const parsedQuestions = JSON.parse(cardData.content);
                      this.testQuestions = Array.isArray(parsedQuestions) ? 
                        parsedQuestions.map((q: any) => ({
                          ...q,
                          answers: q.answers.map((a: any) => ({
                            ...a,
                            isCorrect: a.score === 1
                          }))
                        })) : [];
                    } else {
                      this.testQuestions = [];
                    }
                  } catch (error) {
                    console.error('Error parsing questions from content:', error);
                    this.testQuestions = [];
                  }
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
        console.error(`Error ${isUpdating ? 'updating' : 'creating'} question:`, error);
        alert(`Failed to ${isUpdating ? 'update' : 'create'} question. Please try again.`);
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
  
  // Add method to close edit card popup
  closeEditCardPopup(event: MouseEvent): void {
    if (
      (event.target as HTMLElement).classList.contains('edit-card-popup-overlay') ||
      (event.target as HTMLElement).classList.contains('close-popup-btn') ||
      (event.target as HTMLElement).classList.contains('cancel-btn')
    ) {
      this.isEditCardPopupVisible = false;
      this.cardBeingEdited = null;
      document.body.style.overflow = 'auto';
    }
  }

  // Add method to save edited card
  saveEditedCard(): void {
    if (!this.isEditCardFormValid() || !this.cardBeingEdited) return;
    
    const token = localStorage.getItem('auth-token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    const cardData = {
      id: this.cardBeingEdited.id,
      title: this.editedCardData.title!.trim(),
      description: this.editedCardData.description!.trim(),
      cardType: this.cardBeingEdited.type,
      lessonId: this.cardBeingEdited.lessonId  // Add lessonId to the request
    };
    
    this.http.put('http://localhost:8080/card/update-card', 
      cardData, 
      { headers }
    ).subscribe({
      next: (response: any) => {
        console.log('Card updated:', response);
        
        // Close the edit popup
        this.isEditCardPopupVisible = false;
        document.body.style.overflow = 'auto';
        
        // Refresh lessons data
        this.fetchLessons();
        this.cardBeingEdited = null;
      },
      error: (error) => {
        console.error('Error updating card:', error);
        alert('Failed to update card. Please try again.');
      }
    });
  }

  // Add validation for edit card form
  isEditCardFormValid(): boolean {
    return Boolean(
      this.editedCardData.title && 
      this.editedCardData.title.trim() && 
      this.editedCardData.description && 
      this.editedCardData.description.trim()
    );
  }

  // Method to navigate to question editing for test cards
  editTestCardQuestions(card: Card): void {
    this.isEditCardPopupVisible = false;
    this.editTestCard(card);
  }
  
  deleteCard(card: Card): void {
    if (confirm(`Are you sure you want to delete the card "${card.title}"? This action cannot be undone.`)) {
      console.log('Deleting card:', card);
      
      const token = localStorage.getItem('auth-token');
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
      
      this.http.delete(`http://localhost:8080/card/delete-card/${card.id}`, { headers })
        .subscribe({
          next: (response: any) => {
            console.log('Card deleted:', response);
            // Refresh lessons data to update UI
            this.fetchLessons();
            
            // If we're in the cards popup, close it and reopen with refreshed data
            if (this.isCardsPopupVisible && this.selectedLesson) {
              const lessonId = this.selectedLesson.id;
              this.isCardsPopupVisible = false;
              
              // Wait for fetchLessons to complete, then reopen the cards popup
              this.fetchLessons().then(() => {
                const updatedLesson = this.lessons.find(l => l.id === lessonId);
                if (updatedLesson) {
                  this.viewCards(updatedLesson);
                }
              });
            }
          },
          error: (error) => {
            console.error('Error deleting card:', error);
            alert('Failed to delete card. Please try again.');
          }
        });
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
    
    this.http.post('http://localhost:8080/card/create-card', 
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
      
      const token = localStorage.getItem('auth-token');
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
      
      this.http.delete(`http://localhost:8080/lesson/delete-lesson/${lesson.id}`, { headers })
        .subscribe({
          next: (response: any) => {
            console.log('Lesson deleted:', response);
            // Refresh lessons data
            this.fetchLessons();
          },
          error: (error) => {
            console.error('Error deleting lesson:', error);
            alert('Failed to delete lesson. Please try again.');
          }
        });
    }
  }
}
