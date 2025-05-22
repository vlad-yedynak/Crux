import { Injectable } from '@angular/core';

interface CardTimeData {
  cardId: number;
  totalTimeSpent: number; 
  lastVisit: string;
  visitCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class TimeTrackerService {
  private activeCardId: number | null = null;
  private startTime: number | null = null;
  private readonly STORAGE_KEY = 'card-tracking-data';

  startTracking(cardId: number): void {
    this.activeCardId = cardId;
    this.startTime = Date.now();
    console.log(`Tracking started for card ${cardId}`);
  }

  stopTracking(): void {
    if (!this.activeCardId || !this.startTime) return;

    const timeSpent = Date.now() - this.startTime;
    console.log(`Time spent on card ${this.activeCardId}: ${timeSpent}ms`);

    this.saveTimeData(this.activeCardId, timeSpent);

    this.activeCardId = null;
    this.startTime = null;
  }

  private saveTimeData(cardId: number, timeSpent: number): void {
    const existingDataString = localStorage.getItem(this.STORAGE_KEY);
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

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cardData));
  }

  getCardTimeData(cardId: number): CardTimeData | null {
    const existingDataString = localStorage.getItem(this.STORAGE_KEY);

    if (!existingDataString) return null;

    const cardData: CardTimeData[] = JSON.parse(existingDataString);
    return cardData.find(item => item.cardId === cardId) || null;
  }
  constructor() { }
}
