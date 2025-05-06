import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { AuthServiceService, User } from '../../auth/services/auth-service.service';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { response } from 'express';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule  } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
 
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

  constructor(
    private authService: AuthServiceService,
    @Inject(PLATFORM_ID) private platformId: Object
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
    this.authService.fetchAndSetUser();
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
    const maxPossiblePoints = 100;
    return (points / maxPossiblePoints) * 100;
    
  }
}
