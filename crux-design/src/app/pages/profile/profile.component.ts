import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, ViewChild, ElementRef } from '@angular/core';
import { AuthServiceService, User } from '../../services/auth-service.service';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule  } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { LessonsService, LessonGeneralInfo } from '../../services/lessons.service';
import { CookiesService } from '../../services/cookies.service';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  standalone: true,
  selector: 'app-profile',
  imports: [
    FormsModule,
    CommonModule,
    NgbNavModule,
    ReactiveFormsModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ opacity: 0 }))
      ])
    ]),
    trigger('slideUpDown', [
      transition(':enter', [
        style({ transform: 'translateY(20px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateY(20px)', opacity: 0 }))
      ])
    ])
  ]
})

export class ProfileComponent implements OnInit, OnDestroy {
  @ViewChild('avatarFileInput') avatarFileInput!: ElementRef<HTMLInputElement>;
  
  userInfo: User | null = null;
  activeTab: string = 'info';
  editableFirstName: string = '';
  editableLastName: string = '';
  editableEmail: string = '';

  // Avatar related properties
  selectedAvatarFile: File | null = null;
  avatarPreviewUrl: string | null = null;
  showAvatarUpdateButton: boolean = false;
  isAvatarUploading: boolean = false;

  // Notification properties
  showNotification: boolean = false;
  notificationMessage: string = '';
  notificationIsError: boolean = false;
  private notificationTimeout: any = null;

  lessons: LessonGeneralInfo[] | null = null;
  
  // Add variables for auth check
  isAuthenticated: boolean = false;
  showAuthMessage: boolean = false;
  redirectCountdown: number = 3;
  isLoading: boolean = true;

  // Add a reference to the redirect timer
  private redirectTimer: any = null;

  // Default avatar URL if none is provided
  private defaultAvatarUrl: string = 'https://crux-project-bucket.s3.amazonaws.com/placeholders/defaultAvatar.png';

  constructor(
    private authService: AuthServiceService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private lessonService: LessonsService,
    private cookiesService: CookiesService,
    public router: Router
  ){
    
    if (isPlatformBrowser(this.platformId)) {
      const hasToken = !!this.cookiesService.getCookie('auth-token');
      
      this.isAuthenticated = hasToken;
    }
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      
      const hasToken = !!this.cookiesService.getCookie('auth-token');
      
      if (!hasToken) {
        this.isLoading = false;
        this.showAuthMessage = true;
        this.startRedirectCountdown();
        return;
      }
      
      this.authService.getUser().subscribe(user => {
        this.isLoading = false;
        if (user) {
          this.isAuthenticated = true;
          this.userInfo = user;
          this.editableFirstName = this.userInfo.firstName;
          this.editableLastName = this.userInfo.lastName;
          this.editableEmail = this.userInfo.email;
          
          this.loadLessonData();
        } else {
          this.isAuthenticated = false;
          this.showAuthMessage = true;
          this.startRedirectCountdown();
        }
      });
    }
  }

  private loadLessonData(): void {
    this.lessonService.getBasicLessonsInfo().subscribe(lessonsInfo => {
      if (lessonsInfo && lessonsInfo.length > 0) {
        this.lessons = lessonsInfo;
      } else {
        this.lessonService.ensureDataLoaded(false).subscribe(fullLessons => {
          if (fullLessons) {
            this.lessons = fullLessons.map(lesson => ({
              id: lesson.id,
              title: lesson.title,
              totalPoints: lesson.totalPoints
            }));
          } else {
            this.lessons = null;
          }
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.clearRedirectTimer();
    this.clearNotificationTimeout();
  }

  // Notification methods
  showSuccessNotification(message: string) {
    this.notificationMessage = message;
    this.notificationIsError = false;
    this.showNotification = true;
    this.setNotificationTimeout();
  }

  showErrorNotification(message: string) {
    this.notificationMessage = message;
    this.notificationIsError = true;
    this.showNotification = true;
    this.setNotificationTimeout();
  }

  private setNotificationTimeout() {
    this.clearNotificationTimeout();
    this.notificationTimeout = setTimeout(() => {
      this.showNotification = false;
    }, 5000); // Hide notification after 5 seconds
  }

  private clearNotificationTimeout() {
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
      this.notificationTimeout = null;
    }
  }

  startRedirectCountdown(): void {
    this.clearRedirectTimer();
    
    this.redirectTimer = setInterval(() => {
      this.redirectCountdown--;
      if (this.redirectCountdown <= 0) {
        this.clearRedirectTimer();
        this.router.navigate(['/auth']);
      }
    }, 1000);
  }
  
  clearRedirectTimer(): void {
    if (this.redirectTimer) {
      clearInterval(this.redirectTimer);
      this.redirectTimer = null;
      this.redirectCountdown = 3; // Reset countdown for next time
    }
  }

  saveSettings() {
    if(this.userInfo){
      let hasChanges = false;

      if (this.editableFirstName !== this.userInfo.firstName) {
        hasChanges = true;
        this.authService.changeFirstName(this.editableFirstName).subscribe({
          next: () => {
            console.log('First name update successfully');
            this.userInfo!.firstName = this.editableFirstName;
            this.showSuccessNotification('Ім\'я успішно оновлено');
          },
          error: (err) => {
            console.error('Error updating first name:', err);
            this.showErrorNotification('Помилка при оновленні імені');
          },
        });
      }

      if (this.editableLastName !== this.userInfo.lastName) {
        hasChanges = true;
        this.authService.changeLastName(this.editableLastName).subscribe({
          next: () => {
            console.log('Last name update successfully');
            this.userInfo!.lastName = this.editableLastName;
            this.showSuccessNotification('Прізвище успішно оновлено');
          },
          error: (err) => {
            console.error('Error updating last name:', err);
            this.showErrorNotification('Помилка при оновленні прізвища');
          },
        });
      }

      if (!hasChanges) {
        this.showSuccessNotification('Немає змін для збереження');
      }
    }
  }

  
  getTopicPercentage(points: number, lessonTotalPoints: number): number {
    if (lessonTotalPoints === 0) return 0;
    return (points / lessonTotalPoints) * 100;
    
  }

  getLessonScore(lessonId: number): number {
    if (this.userInfo && this.userInfo.scorePoints) {
      return this.userInfo.scorePoints[String(lessonId)] || 0;
    }
    return 0;
  }

  getCalculatedTotalScorePoints(): number {
    if (this.userInfo && this.userInfo.scorePoints) {
      return Object.values(this.userInfo.scorePoints).reduce((sum, current) => sum + current, 0);
    }
    return 0;
  }

  getTotalScorePercentage(): number {
    const totalScore = this.getCalculatedTotalScorePoints();
    if (this.lessons && this.lessons.length > 0) {
      const maxTotalPossiblePoints = this.lessons.reduce((sum, lesson) => sum + lesson.totalPoints, 0); 
      if (maxTotalPossiblePoints === 0) return 0;
      return (totalScore / maxTotalPossiblePoints) * 100;
    }
    return 0;
  }

  // Avatar handling methods
  onAvatarImageClick() {
    console.log('Avatar image clicked - opening file selector');
    
    // Prevent action if currently uploading
    if (this.isAvatarUploading) {
      console.log('Upload in progress, ignoring click');
      return;
    }
    
    if (this.avatarFileInput) {
      this.avatarFileInput.nativeElement.click();
    } else {
      console.error('Avatar file input not found');
    }
  }

  // Helper method to reset avatar file input
  private resetAvatarFileInput() {
    if (this.avatarFileInput) {
      this.avatarFileInput.nativeElement.value = '';
    }
  }

  onAvatarClick() {
    console.log('Avatar clicked - opening file selector');
    
    // Create a file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    
    // Handle file selection
    fileInput.onchange = (event) => {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        console.log('File selected:', target.files[0].name);
        this.handleAvatarFileSelection(target.files[0]);
      }
    };
    
    // Trigger click on the file input
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
  }

  // New method to handle file selection from static input
  onAvatarFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      console.log('File selected via static input:', input.files[0].name);
      this.handleAvatarFileSelection(input.files[0]);
    }
  }

  // Handle drag and drop for avatar
  onAvatarDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (this.isAvatarUploading) return;
    
    const avatarWrapper = event.currentTarget as HTMLElement;
    avatarWrapper.classList.add('drag-over');
  }

  onAvatarDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    const avatarWrapper = event.currentTarget as HTMLElement;
    avatarWrapper.classList.remove('drag-over');
  }

  onAvatarDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    const avatarWrapper = event.currentTarget as HTMLElement;
    avatarWrapper.classList.remove('drag-over');
    
    if (this.isAvatarUploading) return;
    
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.handleAvatarFileSelection(event.dataTransfer.files[0]);
    }
  }

  handleAvatarFileSelection(file: File) {
    // Check if the file is an image
    if (!file.type.match('image.*')) {
      console.error('Selected file is not an image');
      this.showErrorNotification('Будь ласка, виберіть файл зображення (JPEG, PNG, GIF)');
      return;
    }
    
    // Check file size (limit to 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      console.error('File size exceeds the limit');
      this.showErrorNotification('Розмір зображення не повинен перевищувати 2MB');
      return;
    }

    // Store the selected file
    this.selectedAvatarFile = file;
    
    // Create and display preview
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.avatarPreviewUrl = e.target.result;
      this.showAvatarUpdateButton = true;
    };
    
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      this.showErrorNotification('Помилка читання файлу. Будь ласка, спробуйте інше зображення.');
    };
    
    reader.readAsDataURL(file);
  }

  updateAvatar() {
    if (!this.selectedAvatarFile) return;
    
    this.isAvatarUploading = true;
    
    const reader = new FileReader();
    reader.onload = (e: any) => {
      // Get base64 data (remove the "data:image/jpeg;base64," part)
      const base64Data = e.target.result.split(',')[1];
      const contentType = this.selectedAvatarFile!.type;
      
      this.authService.updateAvatar(base64Data, contentType).subscribe({
        next: (user) => {
          console.log('Avatar updated successfully');
          this.isAvatarUploading = false;
          this.showAvatarUpdateButton = false;
          this.selectedAvatarFile = null;
          this.avatarPreviewUrl = null;
          this.resetAvatarFileInput();
          this.showSuccessNotification('Аватар успішно оновлено');
          // The user data should already be updated in the service
        },
        error: (err) => {
          console.error('Error updating avatar:', err);
          this.isAvatarUploading = false;
          this.showErrorNotification('Помилка при оновленні аватару. Спробуйте ще раз.');
          // Keep the avatarPreviewUrl and selected file in case the user wants to retry
        }
      });
    };
    
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      this.isAvatarUploading = false;
      this.showErrorNotification('Помилка читання файлу. Будь ласка, спробуйте інше зображення.');
    };
    
    reader.readAsDataURL(this.selectedAvatarFile);
  }

  cancelAvatarUpdate() {
    this.avatarPreviewUrl = null;
    this.selectedAvatarFile = null;
    this.showAvatarUpdateButton = false;
    this.resetAvatarFileInput();
  }

  getAvatarUrl(): string {
    if (this.avatarPreviewUrl) {
      return this.avatarPreviewUrl;
    }
    
    if (this.userInfo && this.userInfo.avatar) {
      return this.userInfo.avatar;
    }
    
    return this.defaultAvatarUrl;
  }
}
