import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { AuthServiceService, User } from '../../auth/services/auth-service.service';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule  } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { LessonsService, LessonGeneralInfo } from '../../services/lessons.service';

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

export class ProfileComponent implements OnInit{
  userInfo: User | null = null;
  activeTab: string = 'info';
  editableFirstName: string = '';
  editableLastName: string = '';
  editableEmail: string = '';

  lessons: LessonGeneralInfo[] | null = null;

  constructor(
    private authService: AuthServiceService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private lessonService: LessonsService
  ){
    if (isPlatformBrowser(this.platformId)) {
      console.log("Current session token: ", localStorage.getItem('auth-token'));
    }
  }

  ngOnInit(): void {
    this.authService.getUser().subscribe(user => {
      this.userInfo = user;
      if (this.userInfo) {
        this.editableFirstName = this.userInfo.firstName;
        this.editableLastName = this.userInfo.lastName;
        this.editableEmail = this.userInfo.email;
      }
    });

    this.lessonService.getLessons().subscribe(lessonsData => {
      this.lessons = lessonsData;
      console.log('ProfileComponent: Lessons data received:', this.lessons);
    });
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

  
  getTopicPercentage(points: number): number {
    const maxPossiblePointsPerTopic: number = 100; 
    if (maxPossiblePointsPerTopic === 0) return 0;
    return (points / maxPossiblePointsPerTopic) * 100;
    
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
      const maxTotalPossiblePoints = this.lessons.length * 100; 
      if (maxTotalPossiblePoints === 0) return 0;
      return (totalScore / maxTotalPossiblePoints) * 100;
    }
    return 0;
  }
}
