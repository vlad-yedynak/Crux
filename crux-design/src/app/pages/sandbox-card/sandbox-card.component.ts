import { Component, OnInit, Inject, PLATFORM_ID, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CanvasService, Point } from './services/canvas.service'; 
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface Task {
  id: number;
  name: string;
  description: string;
  points: number;
  isCompleted: boolean;
}

export interface Card {
  id: number;
  title: string;
  description: string;
  content: string | null;
  tasks: Task[];
  sandboxType: string;
  lessonId: number;
  type: string;
}

export interface CardResponse {
  body: Card;
  success: boolean;
  error: string | null;
}
@Component({
  selector: 'app-sandbox-card',
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './sandbox-card.component.html',
  styleUrl: './sandbox-card.component.css',
  providers: [CanvasService]
})
export class SandboxCardComponent implements OnInit, AfterViewInit {
  card: Card | null = null;
  private canvasInitialized = false;
  activePanel: 'shapes' | 'tasks' = 'shapes'; // New property to track active panel

  @ViewChild('myCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasContainer') containerRef!: ElementRef<HTMLElement>;

  isModalVisible = false;
  figurePoints: { x: number; y: number }[] = [];
  figureColor = '#252422';
  borderColor = '#EB5E28';

  selectedTask: Task | null = null;
  taskAnswerInt: string = '';
  taskAnswerDouble: string = '';
  taskAnswerString: string = '';

  constructor(
    private route: ActivatedRoute, 
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
    private canvasService: CanvasService
  ) {}

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser()) {
      const cardId = localStorage.getItem('selectedCardId');
      if (cardId) {
        this.fetchCardDetails(+cardId);
      }
    }
  }

  ngAfterViewInit(): void {
    if (this.isBrowser()) {
      setTimeout(() => this.setupCanvasIfReady(), 100);
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.canvasInitialized) {
      this.updateCanvasSize();
    }
  }

  private updateCanvasSize(): void {
    if (
      this.containerRef && 
      this.containerRef.nativeElement && 
      this.canvasRef && 
      this.canvasRef.nativeElement
    ) {
      const width = this.containerRef.nativeElement.clientWidth;
      const height = this.containerRef.nativeElement.clientHeight;
      
      if (width > 0 && height > 0) {
        this.canvasService.initializeCanvas(this.canvasRef, width, height);
      }
    }
  }

  private setupCanvasIfReady(): void {
    if (
      this.card?.sandboxType === 'CoordinateSystem' &&
      !this.canvasInitialized &&
      this.canvasRef && this.canvasRef.nativeElement &&
      this.containerRef && this.containerRef.nativeElement
    ) {
      this.updateCanvasSize();
      this.canvasInitialized = true; 
    }
  }

  fetchCardDetails(cardId: number): void {
    const token = localStorage.getItem('auth-token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    this.http.get<CardResponse>(
      `http://localhost:8080/lessons/get-card/${cardId}`,
      { headers }
    ).subscribe({
      next: (response) => {
        console.log('Card details:', response.body);
        this.card = response.body;
        setTimeout(() => this.setupCanvasIfReady(), 100);
      },
      error: (err) => {
        console.error('Failed to fetch card details:', err);
      }
    });
  }

  openModal(): void {
    const shapeElement = document.getElementById('shape') as HTMLSelectElement;
    if (!shapeElement) {
      console.error('Element with id "shape" not found.');
      return;
    }
    const shape = shapeElement.value;
    console.log('Selected shape:', shape); 
    
    if (shape === 'square') {
      this.figurePoints = [
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: 1, y: 0 }
      ];
    } else { 
      this.figurePoints = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0.5, y: 1 }
      ];
    }
    
    this.isModalVisible = true;
    document.body.style.overflow = 'hidden'; 
  }

  closeModal(): void {
    this.isModalVisible = false;
    document.body.style.overflow = 'auto'; 
  }

  saveFigure(): void {
    console.log('Figure Points:', this.figurePoints);
    console.log('Figure Color:', this.figureColor);
    console.log('Border Color:', this.borderColor);
    
    const points = this.figurePoints.map(p => new Point(p.x, p.y));
    
    this.canvasService.drawShape(points, this.figureColor, this.borderColor);
    
    this.closeModal();
  }

  selectTask(task: Task): void {
    this.selectedTask = task;
    this.taskAnswerInt = '';
    this.taskAnswerDouble = '';
    this.taskAnswerString = '';
  }

  deselectTask(): void {
    this.selectedTask = null;
  }

  submitTaskAnswer(): void {
    if (this.selectedTask) {
      const token = localStorage.getItem('auth-token');
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      let payload;
      
      if (this.selectedTask.id === 9) {
        
        payload = {
          taskId: this.selectedTask.id,
          inputData: [
            { valueString: String(this.taskAnswerString).trim() }, 
            { valueDouble: Number(this.taskAnswerDouble) },        
            { valueInt: Number(this.taskAnswerInt) }               
          ]
        };
      } else {
        payload = {
          taskId: this.selectedTask.id,
          inputData: [
            { valueInt: Number(this.taskAnswerInt) },              
            { valueDouble: Number(this.taskAnswerDouble) },        
            { valueString: String(this.taskAnswerString).trim() }  
          ]
        };
      }
      
      console.log('Submitting task answer with payload:', JSON.stringify(payload, null, 2));

      this.http.post<{ body: boolean; success: boolean; error: string | null }>(
        'http://localhost:8080/testing/validate-task',
        payload,
        { headers }
      ).subscribe({
        next: (response) => {
          if (response.success) {
            alert(response.body ? 'Correct answer!' : 'Incorrect answer.');
          } else {
            alert(`Validation failed: ${response.error}`);
          }
        },
        error: (err) => {
          console.error('Error validating task answer:', err);
          alert('Failed to validate the answer. Please try again.');
        }
      });

      this.deselectTask();
    }
  }

  // Add new method to switch between panels
  switchPanel(panel: 'shapes' | 'tasks'): void {
    this.activePanel = panel;
  }
}
