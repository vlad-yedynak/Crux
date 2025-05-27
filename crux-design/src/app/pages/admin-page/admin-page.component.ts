import { Component, OnInit, HostListener, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { SanitizeHtmlPipe } from '../../pipes/sanitize-html.pipe';
import { CookiesService } from '../../services/cookies.service';
import { ConfigService } from '../../services/config.service';
import { LessonsService, Lesson, Card } from '../../services/lessons.service'; // Import types from LessonsService
import { Subscription } from 'rxjs';

// Keep only the interfaces that aren't in LessonsService
interface TestAnswer {
  id?: number;
  answerText: string;
  score: number;
  isCorrect: boolean;
  success?: boolean;
  error?: string | null;
}

interface TestQuestion {
  id?: number;
  questionText: string;
  answers: TestAnswer[];
  isCompleted?: boolean;
  success?: boolean;
  error?: string | null;
}

interface TestCardData {
  testCardId: number;
  questionText: string;
  answers: TestAnswer[];
}

interface LessonsResponse {
  body: Lesson[];
  success: boolean;
  error: string;
}

interface TaskExpectedData {
  valueInt?: number;
  valueDouble?: number;
  valueBool?: boolean;
  valueString?: string;
}

interface Task {
  id?: number;
  name: string;
  description: string;
  points: number;
  isCompleted?: boolean | null;
  expectedData?: TaskExpectedData[];
  success?: boolean;
  error?: string | null;
  sandboxCardId?: number;
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
export class AdminPageComponent implements OnInit, OnDestroy {
  // Define a constant for the auth token key to match other services
  private readonly AUTH_TOKEN_KEY = 'auth-token';
  
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
    // sandboxType will be set in resetNewCardForm when needed
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
  
  // Add properties for educational content with file support
  isViewEducationalContentPopupVisible = false;
  isLoadingEducationalContent = false;
  educationalContent: string = '';
  educationalImages: { 
    data?: string; // Base64 data
    contentType?: string; 
    fileName?: string; 
    caption: string; 
    altText: string;
    previewUrl?: string; // For displaying preview
  }[] = [];
  educationalAttachments: { 
    data?: string; // Base64 data
    contentType?: string; 
    fileName?: string; 
    description: string;
  }[] = [];
  hasExistingContent = false;
  
  // Add these properties to store original image data
  originalImageUrls: {[index: number]: string} = {};
  originalAttachmentUrls: {[index: number]: string} = {};
  
  // Add properties for task management
  isViewTasksPopupVisible = false;
  isEditTaskPopupVisible = false;
  isLoadingTasks = false;
  tasks: Task[] = [];
  currentTask: Task | null = null;  newTask: Partial<Task> = {
    name: '',
    description: '',
    points: 0,
    expectedData: [] // Array of expected data with actual values
  };
  taskPopupTitle = '';
  taskPopupSubmitText = '';
  
  // Add subscription property for cleanup
  private lessonsSubscription: Subscription | null = null;
  
  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private cookiesService: CookiesService,
    private configService: ConfigService,
    private lessonsService: LessonsService // Inject LessonsService
  ) {}
  
  ngOnInit(): void {
    const token = this.cookiesService.getCookie(this.AUTH_TOKEN_KEY);
    if (!token) {
      console.log('No authentication token found, redirecting to home page');
      this.router.navigate(['/']);
      return;
    }

    this.testCardData = {
      testCardId: 0,
      questionText: '',
      answers: [] // Always initialize with an empty array
    };
    
    // Subscribe to lessons from LessonsService
    this.lessonsSubscription = this.lessonsService.getLessons().subscribe(lessons => {
      if (lessons) {
        this.lessons = lessons;
        this.isLoading = false;
        this.hasError = false;
      }
    });
    
    // Initialize data from the service
    this.isLoading = true;
    this.lessonsService.initializeData().subscribe({
      error: (error) => {
        console.error('Error initializing lessons data:', error);
        this.isLoading = false;
        this.hasError = true;
        this.errorMessage = 'Не вдалося завантажити дані уроків. Спробуйте ще раз.';
      }
    });
  }
  
  ngOnDestroy(): void {
    // Clean up subscription when component is destroyed
    if (this.lessonsSubscription) {
      this.lessonsSubscription.unsubscribe();
      this.lessonsSubscription = null;
    }
  }
  
  // Remove the fetchLessons() method as it's now redundant
  // And keep the refreshLessons() method that uses LessonsService
  
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
    
    const token = this.cookiesService.getCookie(this.AUTH_TOKEN_KEY);
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    const lessonData = {
      id: this.currentEditingLesson.id,
      title: this.editedLessonName.trim()
    };
    
    this.http.put(`${this.configService.apiUrl}/lesson/update-lesson`, 
      lessonData,
      { headers }
    ).subscribe({
      next: (response: any) => {
        console.log('Lesson updated:', response);
        
        // Close the edit popup
        this.isEditLessonPopupVisible = false;
        document.body.style.overflow = 'auto';
        this.currentEditingLesson = null;
        
        // Refresh lessons data using service
        this.refreshLessons();
        
        // Clear card cache when a lesson is updated
        this.clearCardDetailsCache();
      },
      error: (error) => {
        console.error('Error updating lesson:', error);
        alert('Не вдалося оновити урок. Спробуйте ще раз.');
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
    
    if (this.isViewTasksPopupVisible) {
      this.isViewTasksPopupVisible = false;
      this.currentEditingCard = null;
      document.body.style.overflow = 'auto';
    }
  }
  
  createLesson(): void {
    if (!this.newLessonName.trim()) return;
    
    const token = this.cookiesService.getCookie(this.AUTH_TOKEN_KEY);
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    this.http.post(`${this.configService.apiUrl}/lesson/create-lesson`,
      JSON.stringify( this.newLessonName ),
      { headers }
    ).subscribe({
      next: (response: any) => {
        console.log('Lesson created:', response);
        // Clear card cache when a lesson is created
        this.clearCardDetailsCache();
        // Close the popup
        this.isAddLessonPopupVisible = false;
        document.body.style.overflow = 'auto';
        // Refresh the lessons list using service
        this.refreshLessons();
      },
      error: (error) => {
        console.error('Error creating lesson:', error);
        alert('Не вдалося створити урок. Спробуйте ще раз.');
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

  // Modified to store original URLs but display blank input fields
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
    this.originalImageUrls = {}; // Reset original image URLs
    this.originalAttachmentUrls = {}; // Reset original attachment URLs
    this.hasExistingContent = false;
    
    // Fetch the card data
    const token = this.cookiesService.getCookie(this.AUTH_TOKEN_KEY);
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    this.http.get<any>(`${this.configService.apiUrl}/card/get-card/${card.id}`, { headers })
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
                    
                    // Handle images - check for new base64 structure or legacy URL structure
                    if (parsedContent.images && Array.isArray(parsedContent.images)) {
                      this.educationalImages = parsedContent.images.map((img: any, index: number) => {
                        // Check if this is new base64 structure
                        if (img.data && img.contentType && img.fileName) {
                          // New base64 structure
                          return {
                            data: img.data,
                            contentType: img.contentType,
                            fileName: img.fileName,
                            caption: img.caption || '',
                            altText: img.altText || '',
                            previewUrl: `data:${img.contentType};base64,${img.data}`
                          };
                        } else if (img.url) {
                          // Legacy URL structure - store original URL for fallback
                          let originalUrl = img.url;
                          if (originalUrl && !originalUrl.startsWith('http')) {
                            this.originalImageUrls[index] = `${this.configService.apiUrl}${originalUrl.startsWith('/') ? '' : '/'}${originalUrl}`;
                          } else {
                            this.originalImageUrls[index] = originalUrl;
                          }
                          
                          return {
                            caption: img.caption || '',
                            altText: img.altText || '',
                            previewUrl: this.originalImageUrls[index]
                          };
                        } else {
                          // Empty image entry
                          return {
                            caption: img.caption || '',
                            altText: img.altText || ''
                          };
                        }
                      });
                    }
                    
                    // Handle attachments - check for new base64 structure or legacy URL structure
                    if (parsedContent.attachments && Array.isArray(parsedContent.attachments)) {
                      this.educationalAttachments = parsedContent.attachments.map((att: any, index: number) => {
                        // Check if this is new base64 structure
                        if (att.data && att.contentType && att.fileName) {
                          // New base64 structure
                          return {
                            data: att.data,
                            contentType: att.contentType,
                            fileName: att.fileName,
                            description: att.description || ''
                          };
                        } else if (att.url) {
                          // Legacy URL structure - store original URL for fallback
                          let originalUrl = att.url;
                          if (originalUrl && !originalUrl.startsWith('http')) {
                            this.originalAttachmentUrls[index] = `${this.configService.apiUrl}${originalUrl.startsWith('/') ? '' : '/'}${originalUrl}`;
                          } else {
                            this.originalAttachmentUrls[index] = originalUrl;
                          }
                          
                          return {
                            description: att.description || '',
                            previewUrl: this.originalAttachmentUrls[index]
                          };
                        } else {
                          // Empty attachment entry
                          return {
                            description: att.description || ''
                          };
                        }
                      });
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
                  
                  // Handle images - check for new base64 structure or legacy URL structure
                  if (cardData.content.images && Array.isArray(cardData.content.images)) {
                    this.educationalImages = cardData.content.images.map((img: any, index: number) => {
                      // Check if this is new base64 structure
                      if (img.data && img.contentType && img.fileName) {
                        // New base64 structure
                        return {
                          data: img.data,
                          contentType: img.contentType,
                          fileName: img.fileName,
                          caption: img.caption || '',
                          altText: img.altText || '',
                          previewUrl: `data:${img.contentType};base64,${img.data}`
                        };
                      } else if (img.url) {
                        // Legacy URL structure - store original URL for fallback
                        let originalUrl = img.url;
                        if (originalUrl && !originalUrl.startsWith('http')) {
                          this.originalImageUrls[index] = `${this.configService.apiUrl}${originalUrl.startsWith('/') ? '' : '/'}${originalUrl}`;
                        } else {
                          this.originalImageUrls[index] = originalUrl;
                        }
                        
                        return {
                          caption: img.caption || '',
                          altText: img.altText || '',
                          previewUrl: this.originalImageUrls[index]
                        };
                      } else {
                        // Empty image entry
                        return {
                          caption: img.caption || '',
                          altText: img.altText || ''
                        };
                      }
                    });
                  }
                  
                  // Handle attachments - check for new base64 structure or legacy URL structure
                  if (cardData.content.attachments && Array.isArray(cardData.content.attachments)) {
                    this.educationalAttachments = cardData.content.attachments.map((att: any, index: number) => {
                      // Check if this is new base64 structure
                      if (att.data && att.contentType && att.fileName) {
                        // New base64 structure
                        return {
                          data: att.data,
                          contentType: att.contentType,
                          fileName: att.fileName,
                          description: att.description || ''
                        };
                      } else if (att.url) {
                        // Legacy URL structure - store original URL for fallback
                        let originalUrl = att.url;
                        if (originalUrl && !originalUrl.startsWith('http')) {
                          this.originalAttachmentUrls[index] = `${this.configService.apiUrl}${originalUrl.startsWith('/') ? '' : '/'}${originalUrl}`;
                        } else {
                          this.originalAttachmentUrls[index] = originalUrl;
                        }
                        
                        return {
                          description: att.description || '',
                          previewUrl: this.originalAttachmentUrls[index]
                        };
                      } else {
                        // Empty attachment entry
                        return {
                          description: att.description || ''
                        };
                      }
                    });
                  }
                }
              }
            } catch (error) {
              console.error('Error parsing educational content:', error);
              this.educationalContent = cardData.content || '';
            }
          }
          
          console.log('Educational content loaded:', this.educationalContent);
          console.log('Original image URLs with server prefix:', this.originalImageUrls);
          console.log('Original attachment URLs with server prefix:', this.originalAttachmentUrls);
          this.isLoadingEducationalContent = false;
          this.cdr.detectChanges(); // Force UI update
        },
        error: (error) => {
          console.error('Error fetching educational card data:', error);
          this.educationalContent = 'Помилка завантаження контенту. Спробуйте ще раз.';
          this.isLoadingEducationalContent = false;
          this.cdr.detectChanges(); // Force UI update
        }
      });
  }
  
  // Modified to handle blank URL fields by using original URLs when new ones aren't provided
  // and to handle server prefixed URLs correctly
  saveEducationalContent(): void {
    if (!this.currentEditingCard) return;
    
    // Validate content before saving
    if (!this.isEducationalContentValid()) {
      alert('Please ensure all required fields are filled and all files are selected.');
      return;
    }
    
    // Process images - send base64 data if available, otherwise skip
    const filteredImages = this.educationalImages
      .filter(img => img.data || this.originalImageUrls[this.educationalImages.indexOf(img)])
      .map((img, originalIndex) => {
        const index = this.educationalImages.indexOf(img);
        
        // If we have new base64 data, use it
        if (img.data) {
          return {
            data: img.data,
            contentType: img.contentType || 'image/jpeg',
            fileName: img.fileName || `image_${index + 1}.jpg`,
            caption: img.caption || '',
            altText: img.altText || ''
          };
        }
        // If we have original URL but no new data, keep the existing image (skip in update)
        return null;
      })
      .filter(img => img !== null); // Remove null entries
    
    // Process attachments - send base64 data if available, otherwise skip
    const filteredAttachments = this.educationalAttachments
      .filter(att => att.data || this.originalAttachmentUrls[this.educationalAttachments.indexOf(att)])
      .map((att, originalIndex) => {
        const index = this.educationalAttachments.indexOf(att);
        
        // If we have new base64 data, use it
        if (att.data) {
          return {
            data: att.data,
            contentType: att.contentType || 'application/octet-stream',
            fileName: att.fileName || `attachment_${index + 1}`,
            description: att.description || ''
          };
        }
        // If we have original URL but no new data, keep the existing attachment (skip in update)
        return null;
      })
      .filter(att => att !== null); // Remove null entries
    
    const token = this.cookiesService.getCookie(this.AUTH_TOKEN_KEY);
    
    // Debug token
    console.log('Auth token being used:', token ? token.substring(0, 15) + '...' : 'null');
    
    // Create headers exactly like Postman
    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json');
    
    // Format data according to the API's expected structure
    const educationalData = {
      cardId: this.currentEditingCard.id,
      content: this.educationalContent || '',
      images: filteredImages,
      attachments: filteredAttachments
    };
    
    console.log('Sending educational content with payload:', JSON.stringify(educationalData, null, 2));
    
    // Add options to observe the full HTTP response
    const httpOptions = {
      headers: headers,
      observe: 'response' as const
    };
    
    // Send the request
    this.http.post(`${this.configService.apiUrl}/card/add-educational-data`, 
      educationalData,
      httpOptions
    ).subscribe({
      next: (response: any) => {
        console.log('Educational content update successful!');
        // Clear card cache when educational content is updated
        this.clearCardDetailsCache();
        console.log('Full response:', response);
        
        // Close the content popup
        this.isViewEducationalContentPopupVisible = false;
        document.body.style.overflow = 'auto';
        
        // Refresh lessons data using service
        this.refreshLessons();
        this.currentEditingCard = null;
        
        // Reset the original URL maps
        this.originalImageUrls = {};
        this.originalAttachmentUrls = {};
      },
      error: (error) => {
        console.error('Error updating educational content!');
        console.error('Error status:', error.status);
        console.error('Error status text:', error.statusText);
        
        // Log request details that failed
        console.error('Failed request URL:', `${this.configService.apiUrl}/card/add-educational-data`);
        console.error('Failed request payload:', educationalData);
        
        // Try to extract error details
        if (error.error instanceof ErrorEvent) {
          // Client-side error
          console.error('Client error:', error.error.message);
        } else {
          // Server-side error
          console.error('Server error body:', error.error);
          console.error('Server error status:', error.status);
          console.error('Server error headers:', error.headers?.keys?.());
        }
        
        alert(`Не вдалося оновити навчальний контент: ${error.message}`);
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
    
    const token = this.cookiesService.getCookie(this.AUTH_TOKEN_KEY);
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    this.http.get<any>(`${this.configService.apiUrl}/card/get-card/${card.id}`, { headers })
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
    if (confirm(`Ви впевнені, що хочете видалити питання №${index+1}? Цю дію неможливо скасувати.`)) {
      const token = this.cookiesService.getCookie(this.AUTH_TOKEN_KEY);
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
      
      this.http.delete(`${this.configService.apiUrl}/question/delete-question/${question.id}`, { headers })
        .subscribe({
          next: (response: any) => {
            console.log('Question deleted:', response);
            // Remove from the local array
            this.testQuestions.splice(index, 1);
          },
          error: (error) => {
            console.error('Error deleting question:', error);
            alert('Не вдалося видалити питання. Спробуйте ще раз.');
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
      alert('Тест повинен мати принаймні один варіант відповіді.');
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
    
    const token = this.cookiesService.getCookie(this.AUTH_TOKEN_KEY);
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
      ? `${this.configService.apiUrl}/question/update-question`
      : `${this.configService.apiUrl}/question/create-question`;
    
    const request = isUpdating
      ? this.http.put(endpoint, questionData, { headers })
      : this.http.post(endpoint, questionData, { headers });
    
    // Send the request
    request.subscribe({
      next: (response: any) => {
        console.log(`Question ${isUpdating ? 'updated' : 'created'}:`, response);
        
        // Clear card cache when test questions are updated
        this.clearCardDetailsCache();
        
        // Close the edit popup
        this.isEditTestCardPopupVisible = false;
        
        // Reopen the questions list popup but fetch updated card data
        this.isViewTestQuestionsPopupVisible = true;
        this.isLoadingQuestions = true;
        
        // Fetch the updated card data with questions
        this.http.get<any>(`${this.configService.apiUrl}/card/get-card/${this.currentEditingCard!.id}`, { headers })
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
        alert(`Не вдалося ${isUpdating ? 'оновити' : 'створити'} питання. Спробуйте ще раз.`);
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
    
    const token = this.cookiesService.getCookie(this.AUTH_TOKEN_KEY);
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
    
    this.http.put(`${this.configService.apiUrl}/card/update-card`, 
      cardData, 
      { headers }
    ).subscribe({
      next: (response: any) => {
        console.log('Card updated:', response);
        // Clear card cache when a card is updated
        this.clearCardDetailsCache();
        // Close the edit popup
        this.isEditCardPopupVisible = false;
        document.body.style.overflow = 'auto';
        
        // Refresh lessons data using service
        this.refreshLessons();
        this.cardBeingEdited = null;
      },
      error: (error) => {
        console.error('Error updating card:', error);
        alert('Не вдалося оновити картку. Спробуйте ще раз.');
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
  
  // Add method to navigate to tasks editing for sandbox cards
  editSandboxCardTasks(card: Card): void {
    this.isEditCardPopupVisible = false;
    this.currentEditingCard = card;
    this.isViewTasksPopupVisible = true;
    document.body.style.overflow = 'hidden';
    this.isLoadingTasks = true;
    this.tasks = [];
    
    const token = this.cookiesService.getCookie(this.AUTH_TOKEN_KEY);
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    this.http.get<any>(`${this.configService.apiUrl}/card/get-card/${card.id}`, { headers })
      .subscribe({
        next: (response) => {
          console.log('Sandbox card data loaded:', response);
          
          if (response && response.success && response.body && response.body.tasks) {
            this.tasks = response.body.tasks;
            console.log('Tasks loaded:', this.tasks);
          } else {
            console.log('No tasks found or tasks not in expected format');
            this.tasks = [];
          }
          
          this.isLoadingTasks = false;
          this.cdr.detectChanges(); // Force UI update
        },
        error: (error) => {
          console.error('Error fetching sandbox card data:', error);
          this.isLoadingTasks = false;
          this.cdr.detectChanges(); // Force UI update
        }
      });
  }
  
  deleteCard(card: Card): void {
    if (confirm(`Ви впевнені, що хочете видалити картку "${card.title}"? Цю дію неможливо скасувати.`)) {
      console.log('Deleting card:', card);
      
      const token = this.cookiesService.getCookie(this.AUTH_TOKEN_KEY);
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
      
      this.http.delete(`${this.configService.apiUrl}/card/delete-card/${card.id}`, { headers })
        .subscribe({
          next: (response: any) => {
            console.log('Card deleted:', response);
            // Clear card cache when a card is deleted
            this.clearCardDetailsCache();
            // Refresh lessons data using service
            this.refreshLessons();
            
            // If we're in the cards popup, close it and reopen with refreshed data
            if (this.isCardsPopupVisible && this.selectedLesson) {
              const lessonId = this.selectedLesson.id;
              this.isCardsPopupVisible = false;
              
              // After a short delay to allow refreshed data to arrive
              setTimeout(() => {
                const updatedLesson = this.lessons.find(l => l.id === lessonId);
                if (updatedLesson) {
                  this.viewCards(updatedLesson);
                }
              }, 300);
            }
          },
          error: (error) => {
            console.error('Error deleting card:', error);
            alert('Не вдалося видалити картку. Спробуйте ще раз.');
          }
        });
    }
  }
  
  // Replace the direct HTTP fetch with LessonsService method
  refreshLessons(): void {
    this.isLoading = true;
    this.hasError = false;
    
    this.lessonsService.forceRefreshLessons().subscribe({
      next: () => {
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error refreshing lessons:', error);
        this.hasError = true;
        this.errorMessage = 'Не вдалося завантажити уроки. Спробуйте ще раз.';
        this.isLoading = false;
      }
    });
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
    
    // Reset form completely
    this.resetNewCardForm();
    
    // Set flag to show popup
    this.isAddCardPopupVisible = true;
    
    // Force change detection to update the view
    this.cdr.detectChanges();
    
    console.log('Card popup state:', {
      isCardPopupVisible: this.isAddCardPopupVisible,
      currentLesson: this.currentLessonForCard?.title,
      sandboxType: this.newCard.sandboxType // Fixed property name here
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
      content: '',
      sandboxType: 'Primitives' // Updated property name to match Card interface
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
    
    const token = this.cookiesService.getCookie(this.AUTH_TOKEN_KEY);
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    // Update the payload to include sandboxType for sandbox cards
    const cardData: any = {
      title: this.newCard.title!.trim(),
      description: this.newCard.description!.trim(),
      cardType: this.newCard.type,
      lessonId: this.currentLessonForCard.id
    };
    
    // Add sandboxType if it's a sandbox card - make sure to get the current value
    if (this.newCard.type === 'Sandbox') {
      // Ensure sandboxType is set to a default if undefined
      cardData.sandboxType = this.newCard.sandboxType || 'Primitives';
      console.log('Creating sandbox card with type:', cardData.sandboxType);
      console.log('Current newCard object:', JSON.stringify(this.newCard, null, 2));
    }
    
    console.log('Final card data being sent:', cardData);
    
    this.http.post(`${this.configService.apiUrl}/card/create-card`, 
      cardData, 
      { headers }
    ).subscribe({
      next: (response: any) => {
        console.log('Card created:', response);
        // Clear card cache when a card is created
        this.clearCardDetailsCache();
        // Close the add card popup
        this.isAddCardPopupVisible = false;
        
        // Reset the form completely after successful creation
        this.resetNewCardForm();
        
        // Refresh lessons data using service
        this.refreshLessons();
        
        // After a short delay to allow refreshed data to arrive
        setTimeout(() => {
          const updatedLesson = this.lessons.find(l => l.id === this.currentLessonForCard!.id);
          if (updatedLesson) {
            this.viewCards(updatedLesson);
          }
          this.currentLessonForCard = null;
        }, 300);
      },
      error: (error) => {
        console.error('Error creating card:', error);
        alert('Не вдалося створити картку. Спробуйте ще раз.');
      }
    });
  }
  
  deleteLesson(lesson: Lesson): void {
    if (confirm(`Ви впевнені, що хочете видалити "${lesson.title}"? Цю дію неможливо скасувати.`)) {
      console.log('Deleting lesson:', lesson);
      
      const token = this.cookiesService.getCookie(this.AUTH_TOKEN_KEY);
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
      
      this.http.delete(`${this.configService.apiUrl}/lesson/delete-lesson/${lesson.id}`, { headers })
        .subscribe({
          next: (response: any) => {
            console.log('Lesson deleted:', response);
            // Clear card cache when a lesson is deleted
            this.clearCardDetailsCache();
            this.refreshLessons();
          },
          error: (error) => {
            console.error('Error deleting lesson:', error);
            alert('Не вдалося видалити урок. Спробуйте ще раз.');
          }
        });
    }
  }

  // Method to close educational content popup - add the missing method
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
  
  // Add these HTML editor methods
  insertHeader(level: number): void {
    this.insertHtmlTag(`<h${level}>`, `</h${level}>`);
  }
  
  insertBold(): void {
    this.insertHtmlTag('<strong>', '</strong>');
  }
  
  insertItalic(): void {
    this.insertHtmlTag('<em>', '</em>');
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
  
  // Add these methods for images and attachments
  addImage(): void {
    const newImage = {
      caption: '',
      altText: ''
    };
    this.educationalImages.push(newImage);
  }

  removeImage(index: number): void {
    if (index >= 0 && index < this.educationalImages.length) {
      this.educationalImages.splice(index, 1);
      delete this.originalImageUrls[index];
      // Reindex remaining originalImageUrls
      Object.keys(this.originalImageUrls).forEach((key) => {
        const keyNum = parseInt(key);
        if (keyNum > index) {
          this.originalImageUrls[keyNum-1] = this.originalImageUrls[keyNum];
          delete this.originalImageUrls[keyNum];
        }
      });
    }
  }

  addAttachment(): void {
    const newAttachment = {
      description: ''
    };
    this.educationalAttachments.push(newAttachment);
  }

  removeAttachment(index: number): void {
    if (index >= 0 && index < this.educationalAttachments.length) {
      this.educationalAttachments.splice(index, 1);
      delete this.originalAttachmentUrls[index];
      // Reindex remaining originalAttachmentUrls
      Object.keys(this.originalAttachmentUrls).forEach((key) => {
        const keyNum = parseInt(key);
        if (keyNum > index) {
          this.originalAttachmentUrls[keyNum-1] = this.originalAttachmentUrls[keyNum];
          delete this.originalAttachmentUrls[keyNum];
        }
      });
    }
  }

  // Add method to close the tasks view popup
  closeViewTasksPopup(event: MouseEvent): void {
    if (
      (event.target as HTMLElement).classList.contains('view-tasks-overlay') ||
      (event.target as HTMLElement).classList.contains('close-popup-btn')
    ) {
      this.isViewTasksPopupVisible = false;
      this.currentEditingCard = null;
      document.body.style.overflow = 'auto'; // Re-enable scrolling
    }
  }  // Add method to open the popup for adding a new task
  openAddTaskPopup(): void {
    console.log('Opening add task popup');
    
    this.taskPopupTitle = 'Add New Task';
    this.taskPopupSubmitText = 'Create Task';
      // Reset the form with empty values
    this.newTask = {
      name: '',
      description: '',
      points: 0,
      expectedData: []
    };
    
    console.log('Reset newTask for new task:', this.newTask);
    
    this.currentTask = null;
    this.isEditTaskPopupVisible = true;
    document.body.style.overflow = 'hidden'; // Prevent scrolling
    
    // Force change detection to ensure UI updates
    this.cdr.detectChanges();
  }
  
  // Update method to open the popup for editing an existing task
  openEditTaskPopup(task: Task): void {
    console.log('Opening edit task popup for task:', task);
    
    this.taskPopupTitle = 'Edit Task';
    this.taskPopupSubmitText = 'Save Changes';
    
    // For editing, preserve data types but clear values for new input
    const preservedDataTypes: TaskExpectedData[] = [];
    if (task.expectedData && task.expectedData.length > 0) {
      task.expectedData.forEach(data => {
        // Determine the data type from the existing data
        let dataType = '';
        if (data.hasOwnProperty('valueInt')) {
          dataType = 'int';
        } else if (data.hasOwnProperty('valueDouble')) {
          dataType = 'double';
        } else if (data.hasOwnProperty('valueString')) {
          dataType = 'string';
        } else if (data.hasOwnProperty('valueBool')) {
          dataType = 'bool';
        }
        
        // Create new data object with type but empty value
        if (dataType) {
          preservedDataTypes.push(this.createEmptyDataObject(dataType));
        }
      });
    }
    
    // Populate the form with existing task data but empty expectedData values
    this.newTask = {
      name: task.name || '',
      description: task.description || '',
      points: task.points || 0,
      expectedData: preservedDataTypes,
      sandboxCardId: task.sandboxCardId,
      id: task.id
    };
    
    console.log('Populated newTask with preserved data types but empty values:', this.newTask);
    
    this.currentTask = task;
    this.isEditTaskPopupVisible = true;
    document.body.style.overflow = 'hidden'; // Prevent scrolling
    
    // Force change detection to ensure UI updates
    this.cdr.detectChanges();
  }// Add method to close the task popup
  closeEditTaskPopup(event: MouseEvent): void {
    // Only close if clicking the overlay or close button or cancel button
    if (
      (event.target as HTMLElement).classList.contains('edit-task-overlay') ||
      (event.target as HTMLElement).classList.contains('close-popup-btn') ||
      (event.target as HTMLElement).classList.contains('cancel-btn')
    ) {
      this.isEditTaskPopupVisible = false;
      this.currentTask = null;
        // Reset the form data when closing
      this.newTask = {
        name: '',
        description: '',
        points: 0,
        expectedData: []
      };
      
      document.body.style.overflow = 'auto'; // Re-enable scrolling
    }
  }
  // Add method to save tasks
  saveTask(): void {
    if (!this.isTaskFormValid() || !this.currentEditingCard) return;
    
    const token = this.cookiesService.getCookie(this.AUTH_TOKEN_KEY);
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
      // Determine if we're updating an existing task or creating a new one
    const isUpdating = this.currentTask !== null && this.currentTask.id !== undefined;
    
    // Format task data according to the API's expected structure
    const taskData = {
      // Include the task ID only if updating an existing task
      ...(isUpdating ? { id: this.currentTask!.id } : {}),
      name: this.newTask.name,
      description: this.newTask.description,
      points: this.newTask.points,
      sandboxCardId: this.currentEditingCard.id,
      expectedData: this.newTask.expectedData || []
    };
    
    console.log(`${isUpdating ? 'Updating' : 'Creating'} task:`, JSON.stringify(taskData, null, 2));
    
    // Choose the appropriate endpoint and HTTP method based on whether we're updating or creating
    const endpoint = isUpdating 
      ? `${this.configService.apiUrl}/task/update-task`
      : `${this.configService.apiUrl}/task/create-task`;
    
    const request = isUpdating
      ? this.http.put(endpoint, taskData, { headers })
      : this.http.post(endpoint, taskData, { headers });
    
    // Send the request
    request.subscribe({
      next: (response: any) => {
        console.log(`Task ${isUpdating ? 'updated' : 'created'}:`, response);
        // Clear card cache when tasks are updated
        this.clearCardDetailsCache();
        // Close the edit popup
        this.isEditTaskPopupVisible = false;
        document.body.style.overflow = 'auto';
        this.currentTask = null;
        
        // Refresh the tasks list
        this.refreshTasks();
      },
      error: (error) => {
        console.error(`Error ${isUpdating ? 'updating' : 'creating'} task:`, error);
        alert(`Не вдалося ${isUpdating ? 'оновити' : 'створити'} завдання. Спробуйте ще раз.`);
      }
    });
  }
  
  // Add method to delete tasks
  deleteTask(task: Task, index: number): void {
    if (confirm(`Ви впевнені, що хочете видалити завдання "${task.name}"? Цю дію неможливо скасувати.`)) {
      const token = this.cookiesService.getCookie(this.AUTH_TOKEN_KEY);
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
      
      this.http.delete(`${this.configService.apiUrl}/task/delete-task/${task.id}`, { headers })
        .subscribe({
          next: (response: any) => {
            console.log('Task deleted:', response);
            // Clear card cache when a task is deleted
            this.clearCardDetailsCache();
            // Remove from the local array
            this.tasks.splice(index, 1);
          },
          error: (error) => {
            console.error('Error deleting task:', error);
            alert('Не вдалося видалити завдання. Спробуйте ще раз.');
          }
        });
    }
  }
  
  // Add method to refresh tasks
  refreshTasks(): void {
    if (!this.currentEditingCard) return;
    
    this.isLoadingTasks = true;
    const token = this.cookiesService.getCookie(this.AUTH_TOKEN_KEY);
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    this.http.get<any>(`${this.configService.apiUrl}/card/get-card/${this.currentEditingCard.id}`, { headers })
      .subscribe({
        next: (response) => {
          console.log('Refreshed sandbox card data loaded:', response);
          
          if (response && response.success && response.body && response.body.tasks) {
            this.tasks = response.body.tasks;
          } else {
            this.tasks = [];
          }
          
          this.isLoadingTasks = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error refreshing tasks:', error);
          this.isLoadingTasks = false;
          this.cdr.detectChanges();
        }
      });
  }
  
  // Add method to validate task form
  isTaskFormValid(): boolean {
    return Boolean(
      this.newTask.name && 
      this.newTask.name.trim() && 
      this.newTask.description && 
      this.newTask.description.trim() &&
      this.newTask.points !== undefined && 
      this.newTask.points >= 0
    );
  }
  // Add method to add expected data to task
  addExpectedData(): void {
    if (!this.newTask.expectedData) {
      this.newTask.expectedData = [];
    }
    
    // Add a new default data object with string type
    this.newTask.expectedData.push({ valueString: '' });
    
    this.cdr.detectChanges();
  }
    // Add method to remove expected data from task
  removeExpectedData(index: number): void {
    if (this.newTask.expectedData && index >= 0 && index < this.newTask.expectedData.length) {
      this.newTask.expectedData.splice(index, 1);
      this.cdr.detectChanges();
    }
  }
    // Add method to update expected data type and value at index
  updateExpectedDataType(index: number, type: string): void {
    if (this.newTask.expectedData && index >= 0 && index < this.newTask.expectedData.length) {
      const currentData = this.newTask.expectedData[index];
      
      // Create new data object based on type
      switch (type) {
        case 'int':
          this.newTask.expectedData[index] = { valueInt: currentData.valueInt || 0 };
          break;
        case 'double':
          this.newTask.expectedData[index] = { valueDouble: currentData.valueDouble || 0.0 };
          break;
        case 'bool':
          this.newTask.expectedData[index] = { valueBool: currentData.valueBool || false };
          break;
        case 'string':
        default:
          this.newTask.expectedData[index] = { valueString: currentData.valueString || '' };
          break;
      }
      
      this.cdr.detectChanges();
    }
  }

  // Add method to update expected data value at index
  updateExpectedDataValue(index: number, value: any): void {
    if (this.newTask.expectedData && index >= 0 && index < this.newTask.expectedData.length) {
      const currentData = this.newTask.expectedData[index];
      
      // Update the appropriate value based on the data type
      if (currentData.hasOwnProperty('valueInt')) {
        currentData.valueInt = parseInt(value) || 0;
      } else if (currentData.hasOwnProperty('valueDouble')) {
        currentData.valueDouble = parseFloat(value) || 0.0;
      } else if (currentData.hasOwnProperty('valueBool')) {
        currentData.valueBool = value === 'true' || value === true;
      } else if (currentData.hasOwnProperty('valueString')) {
        currentData.valueString = value || '';
      }
      
      this.cdr.detectChanges();
    }
  }

  // Add helper method to get data type from expected data object
  getExpectedDataType(data: TaskExpectedData): string {
    if (data.hasOwnProperty('valueInt')) return 'int';
    if (data.hasOwnProperty('valueDouble')) return 'double';
    if (data.hasOwnProperty('valueBool')) return 'bool';
    if (data.hasOwnProperty('valueString')) return 'string';
    return 'string'; // default
  }
  // Add helper method to get data value from expected data object
  getExpectedDataValue(data: TaskExpectedData): any {
    if (data.hasOwnProperty('valueInt')) return data.valueInt;
    if (data.hasOwnProperty('valueDouble')) return data.valueDouble;
    if (data.hasOwnProperty('valueBool')) return data.valueBool;
    if (data.hasOwnProperty('valueString')) return data.valueString;
    return '';
  }

  // Add helper method to create empty data object based on type
  createEmptyDataObject(dataType: string): TaskExpectedData {
    switch (dataType) {
      case 'int':
        return { valueInt: 0 };
      case 'double':
        return { valueDouble: 0.0 };
      case 'bool':
        return { valueBool: false };
      case 'string':
      default:
        return { valueString: '' };
    }
  }

  private clearCardDetailsCache(): void {
    if (typeof localStorage !== 'undefined') {
      console.log('Clearing all card detail cache from localStorage');
      
      const keys = Object.keys(localStorage);
      
      const cardDetailKeys = keys.filter(key => key.startsWith('app-card-detail-'));
      
      cardDetailKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log(`Removed cached card data: ${key}`);
      });
      
      console.log(`Cleared ${cardDetailKeys.length} cached card entries`);
    }
  }

  // File handling methods
  onImageFileSelected(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file.');
        return;
      }
      
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(`File size must be less than 10MB. Current file size: ${this.formatFileSize(file.size)}`);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = reader.result as string;
        // Remove the data:image/xxx;base64, prefix
        const base64String = base64Data.split(',')[1];
        
        // Update the image object
        this.educationalImages[index] = {
          ...this.educationalImages[index],
          data: base64String,
          contentType: file.type,
          fileName: file.name,
          previewUrl: base64Data // Keep full data URL for preview
        };
        
        console.log(`Image ${index} loaded:`, {
          fileName: file.name,
          contentType: file.type,
          size: this.formatFileSize(file.size),
          dataLength: base64String.length
        });
      };
      
      reader.onerror = () => {
        console.error('Error reading file');
        alert('Error reading file. Please try again.');
      };
      
      reader.readAsDataURL(file);
    }
  }

  onAttachmentFileSelected(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validate file type
      if (!this.isValidAttachmentType(file)) {
        alert('Please select a valid file type (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV, ZIP).');
        return;
      }
      
      // Validate file size (max 25MB)
      const maxSize = 25 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(`File size must be less than 25MB. Current file size: ${this.formatFileSize(file.size)}`);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = reader.result as string;
        // Remove the data:xxx;base64, prefix
        const base64String = base64Data.split(',')[1];
        
        // Update the attachment object
        this.educationalAttachments[index] = {
          ...this.educationalAttachments[index],
          data: base64String,
          contentType: file.type,
          fileName: file.name
        };
        
        console.log(`Attachment ${index} loaded:`, {
          fileName: file.name,
          contentType: file.type,
          size: this.formatFileSize(file.size),
          dataLength: base64String.length
        });
      };
      
      reader.onerror = () => {
        console.error('Error reading file');
        alert('Error reading file. Please try again.');
      };
      
      reader.readAsDataURL(file);
    }
  }

  // Validation method for educational content
  isEducationalContentValid(): boolean {
    // Check if content is not empty
    if (!this.educationalContent || this.educationalContent.trim() === '') {
      return false;
    }
    
    // Check if all images have either data or existing URLs
    for (let i = 0; i < this.educationalImages.length; i++) {
      const img = this.educationalImages[i];
      if (!img.data && !this.originalImageUrls[i]) {
        console.warn(`Image ${i + 1} has no file selected`);
        return false;
      }
    }
    
    // Check if all attachments have either data or existing URLs
    for (let i = 0; i < this.educationalAttachments.length; i++) {
      const att = this.educationalAttachments[i];
      if (!att.data && !this.originalAttachmentUrls[i]) {
        console.warn(`Attachment ${i + 1} has no file selected`);
        return false;
      }
    }
    
    return true;
  }

  // Method to get file size in human readable format
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Method to validate file type for attachments
  private isValidAttachmentType(file: File): boolean {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'application/zip',
      'application/x-zip-compressed'
    ];
    
    return allowedTypes.includes(file.type);
  }
}
