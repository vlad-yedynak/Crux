import { Component } from '@angular/core';
import { CommonModule } from "@angular/common";

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  template: `
    <header class="main-header">
        <div class="logo">
            <h1>Goida</h1>
        </div>
        <div class="profile-container">
            <div class="profile">
                <img src="./profile_placeholder.jpg" alt="Profile" class="profile-pic">
                <span class="profile-name">User Name</span>
                <div class="profile-dropdown">
                    <button class="btn sign-in">Sign In</button>
                    <button class="btn sign-up">Sign Up</button>
                </div>
            </div>
        </div>
    </header>
  `,
  styleUrl: './header.component.css'
})
export class HeaderComponent {

}
