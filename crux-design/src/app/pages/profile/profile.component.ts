import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { AuthServiceService, User } from '../../services/auth-service.service';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule  } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { LessonsService, LessonGeneralInfo } from '../../services/lessons.service';
import { CookiesService } from '../../services/cookies.service';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-profile',
  imports: [
    FormsModule,
    CommonModule,
    NgbNavModule,
    ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})

export class ProfileComponent implements OnInit, OnDestroy {
  userInfo: User | null = null;
  activeTab: string = 'info';
  editableFirstName: string = '';
  editableLastName: string = '';
  editableEmail: string = '';

  lessons: LessonGeneralInfo[] | null = null;
  
  // Add variables for auth check
  isAuthenticated: boolean = false;
  showAuthMessage: boolean = false;
  redirectCountdown: number = 3;
  isLoading: boolean = true;

  // Add a reference to the redirect timer
  private redirectTimer: any = null;

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
      this.authService.changeFirstName(this.editableFirstName).subscribe({
        next: () => {
          console.log('First name update successfully');
          this.userInfo!.firstName = this.editableFirstName;
        },
        error: (err) => {
          console.error('Error updating first name:', err);
        },
      });

      this.authService.changeLastName(this.editableLastName).subscribe({
        next: () => {
          console.log('Last name update successfully');
          this.userInfo!.lastName = this.editableLastName;
        },
        error: (err) => {
          console.error('Error updating last name:', err);
        },
      })
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
}
