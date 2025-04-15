import { Component } from '@angular/core';

@Component({
  selector: 'app-profile',
  imports: [],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})

export class ProfileComponent {
  constructor(){
    console.log("Current session token: ", localStorage.getItem('auth-token'))
  }
}
