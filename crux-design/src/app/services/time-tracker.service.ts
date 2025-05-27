import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ConfigService } from './config.service';
import { CookiesService } from './cookies.service';

interface CardTimeData {
  cardId: number;
  totalTimeSpent: number; 
  lastVisit: string;
  visitCount: number;
}

interface LessonTimeData {
  lessonId: number;
  totalTimeSpent: number;
  lastVisit: string;
  visitCount: number;
  cards: {[cardId: number]: number}; 
}

@Injectable({
  providedIn: 'root'
})
export class TimeTrackerService {
  private activeCardId: number | null = null;
  private activeLessonId: number | null = null;
  private startTime: number | null = null;
  private readonly CARD_STORAGE_KEY = 'card-tracking-data';
  private readonly LESSON_STORAGE_KEY = 'lesson-tracking-data';
  private readonly AUTH_TOKEN_KEY = 'auth-token';
  private readonly USER_ID_KEY = 'user-id';
  
  constructor(
    private http: HttpClient,
    private configService: ConfigService,
    private cookiesService: CookiesService
  ) {}

  startTracking(cardId: number, lessonId: number): void {
    this.activeCardId = cardId;
    this.activeLessonId = lessonId;
    this.startTime = Date.now();
    console.log(`Tracking started for card ${cardId} in lesson ${lessonId}`);
  }

  stopTracking(): void {
    if (!this.activeCardId || !this.activeLessonId || !this.startTime) return;

    const timeSpent = Date.now() - this.startTime;
    console.log(`Time spent on card ${this.activeCardId} in lesson ${this.activeLessonId}: ${timeSpent}ms`);

    // Save time for both card and lesson
    this.saveCardTimeData(this.activeCardId, timeSpent);
    this.saveLessonTimeData(this.activeLessonId, this.activeCardId, timeSpent);
    
    // Send data to server after saving to localStorage
    this.sendLessonTimeToServer(this.activeLessonId, timeSpent);

    this.activeCardId = null;
    this.activeLessonId = null;
    this.startTime = null;
  }

  private saveCardTimeData(cardId: number, timeSpent: number): void {
    const existingDataString = localStorage.getItem(this.CARD_STORAGE_KEY);
    let cardData: CardTimeData[] = [];

    if (existingDataString) {
      cardData = JSON.parse(existingDataString);
    }

    const existingCardIndex = cardData.findIndex(item => item.cardId === cardId);

    if (existingCardIndex >= 0) {
      cardData[existingCardIndex].totalTimeSpent += timeSpent;
      cardData[existingCardIndex].lastVisit = new Date().toISOString();
      cardData[existingCardIndex].visitCount++;
    } else {
      cardData.push({
        cardId,
        totalTimeSpent: timeSpent,
        lastVisit: new Date().toISOString(),
        visitCount: 1
      });
    }

    localStorage.setItem(this.CARD_STORAGE_KEY, JSON.stringify(cardData));
  }

  private saveLessonTimeData(lessonId: number, cardId: number, timeSpent: number): void {
    const existingDataString = localStorage.getItem(this.LESSON_STORAGE_KEY);
    let lessonData: LessonTimeData[] = [];

    if (existingDataString) {
      lessonData = JSON.parse(existingDataString);
    }

    const existingLessonIndex = lessonData.findIndex(item => item.lessonId === lessonId);
    const currentTime = new Date().toISOString();

    if (existingLessonIndex >= 0) {
      lessonData[existingLessonIndex].totalTimeSpent += timeSpent;
      lessonData[existingLessonIndex].lastVisit = currentTime;
      lessonData[existingLessonIndex].visitCount++;
      
      if (!lessonData[existingLessonIndex].cards) {
        lessonData[existingLessonIndex].cards = {};
      }
      
      if (lessonData[existingLessonIndex].cards[cardId]) {
        lessonData[existingLessonIndex].cards[cardId] += timeSpent;
      } else {
        lessonData[existingLessonIndex].cards[cardId] = timeSpent;
      }
    } else {
      lessonData.push({
        lessonId,
        totalTimeSpent: timeSpent,
        lastVisit: currentTime,
        visitCount: 1,
        cards: {
          [cardId]: timeSpent
        }
      });
    }

    localStorage.setItem(this.LESSON_STORAGE_KEY, JSON.stringify(lessonData));
  }

  
  private sendLessonTimeToServer(lessonId: number, timeSpent: number): void {
    // Get the auth token from cookies
    const token = this.cookiesService.getCookie(this.AUTH_TOKEN_KEY);
    
    // Try to get userId from cookies first (more reliable)
    let userId = this.cookiesService.getCookie(this.USER_ID_KEY);
    
    // If not in cookies, try localStorage as fallback
    if (!userId) {
      userId = localStorage.getItem('userId');
      console.log('Using userId from localStorage:', userId);
    }
    
    // If still no userId, use email or default value
    if (!userId) {
      userId = localStorage.getItem('userEmail') || '0';
      console.log('Using email or default as userId:', userId);
    }
    
    // Verify lessonId is valid
    if (!lessonId || isNaN(lessonId)) {
      const savedLessonId = localStorage.getItem('selectedLessonId');
      if (savedLessonId) {
        lessonId = parseInt(savedLessonId, 10);
        console.log('Using lessonId from localStorage:', lessonId);
      } else {
        console.error('No valid lessonId available for tracking');
        return;
      }
    }
      const payload = {
      userId: userId,
      lessonId: lessonId,
      trackedTime: Math.floor(timeSpent / 1000) // Convert milliseconds to seconds
    };
    
    console.log('Sending tracking data to server:', payload);
    
    // Set up headers with authorization
    let headers = new HttpHeaders().set('Content-Type', 'application/json');
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    } else {
      console.warn('No auth token available, request may fail');
    }
    
    const endpoint = this.configService.getEndpoint('/personalization/update-lesson-time');
    
    this.http.post(endpoint, payload, { headers }).subscribe({
      next: (response) => {
        console.log('Time tracking data sent to server successfully:', response);
      },
      error: (error) => {
        console.error('Failed to send time tracking data to server:', error);
      }
    });
  }

  getCardTimeData(cardId: number): CardTimeData | null {
    const existingDataString = localStorage.getItem(this.CARD_STORAGE_KEY);

    if (!existingDataString) return null;

    const cardData: CardTimeData[] = JSON.parse(existingDataString);
    return cardData.find(item => item.cardId === cardId) || null;
  }
  
  getLessonTimeData(lessonId: number): LessonTimeData | null {
    const existingDataString = localStorage.getItem(this.LESSON_STORAGE_KEY);

    if (!existingDataString) return null;

    const lessonData: LessonTimeData[] = JSON.parse(existingDataString);
    return lessonData.find(item => item.lessonId === lessonId) || null;
  }
  
  getTotalTimeSpent(): number {
    const existingDataString = localStorage.getItem(this.LESSON_STORAGE_KEY);
    if (!existingDataString) return 0;
    
    const lessonData: LessonTimeData[] = JSON.parse(existingDataString);
    return lessonData.reduce((total, lesson) => total + lesson.totalTimeSpent, 0);
  }
  
  getFormattedTime(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}г ${minutes % 60}хв`;
    } else if (minutes > 0) {
      return `${minutes}хв ${seconds % 60}с`;
    } else {
      return `${seconds}с`;
    }
  }

 
  startTimeTrackingFromStorage(): boolean {
    if (typeof localStorage === 'undefined') return false;
    
    const cardId = localStorage.getItem('selectedCardId');
    const lessonId = localStorage.getItem('selectedLessonId');
    
    if (cardId && lessonId) {
      const cardIdNum = parseInt(cardId, 10);
      const lessonIdNum = parseInt(lessonId, 10);
      
      if (!isNaN(cardIdNum) && !isNaN(lessonIdNum)) {
        this.startTracking(cardIdNum, lessonIdNum);
        console.log(`Started tracking time for card ${cardIdNum} in lesson ${lessonIdNum} from localStorage`);
        return true;
      }
    }
    
    console.warn('Failed to start time tracking: missing card or lesson ID in localStorage');
    return false;
  }

  resetAllTimeData(): Promise<any> {
    return new Promise((resolve, reject) => {
      // Get the auth token from cookies
      const token = this.cookiesService.getCookie(this.AUTH_TOKEN_KEY);
      
      // Set up headers with authorization
      let headers = new HttpHeaders().set('Content-Type', 'application/json');
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      } else {
        console.warn('No auth token available, request may fail');
        reject('No auth token available');
        return;
      }
      
      const endpoint = this.configService.getEndpoint('/personalization/reset-all-time');
      
      this.http.delete(endpoint, { headers, responseType: 'text' }).subscribe({
        next: (response) => {
          console.log('All time data reset successfully:', response);
          
          // Clear local storage time tracking data as well
          localStorage.removeItem(this.CARD_STORAGE_KEY);
          localStorage.removeItem(this.LESSON_STORAGE_KEY);
          
          resolve(response);
        },
        error: (error) => {
          console.error('Failed to reset time data:', error);
          reject(error);
        }
      });
    });
  }
}
