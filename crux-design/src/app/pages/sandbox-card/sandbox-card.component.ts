import { Component, OnInit, Inject, PLATFORM_ID, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CanvasService, Point, ShapeData, validateSquarePoints, validateTrianglePoints, validateRectanglePoints, validateCircleData, validatePolygonPoints } from './services/canvas.service'; 
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { trigger, state, style, animate, transition } from '@angular/animations'; // Import animation modules

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
  providers: [CanvasService],
  animations: [
    trigger('slideTogglePanel', [
      state('void', style({
        opacity: 0,
        maxHeight: '0px', // Використовуємо maxHeight
        paddingTop: '0px',
        paddingBottom: '0px',
        marginTop: '0px',
        // transform: 'scaleY(0)' // Видалено
      })),
      state('*', style({
        opacity: 1,
        maxHeight: '500px', // Достатньо велике значення для вмісту
        paddingTop: '10px',
        paddingBottom: '10px',
        marginTop: '8px',
        // transform: 'scaleY(1)' // Видалено
      })),
      transition('void <=> *', [
        animate('300ms ease-in-out')
      ])
    ])
  ]
})
export class SandboxCardComponent implements OnInit, AfterViewInit {
  card: Card | null = null;
  private canvasInitialized = false;
  activePanel: 'shapes' | 'tasks' = 'shapes'; 

  @ViewChild('myCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasContainer') containerRef!: ElementRef<HTMLElement>;

  selectedTask: Task | null = null;
  taskAnswerInt: string = '';
  taskAnswerDouble: string = '';
  taskAnswerString: string = '';

  selectedShapeType: string = 'square'; 
  drawnShapes: ShapeData[] = [];
  defaultFillColor: string = '#403D39'; 
  defaultBorderColor: string = '#EB5E28'; 
  editingShapeId: string | null = null; 
  isNewShape: boolean = false; 

  private originalShapeDataBeforeEdit: ShapeData | null = null;

  shapeName: string = '';
  shapeFillColor: string = '';
  shapeBorderColor: string = '';
  shapePoints: Point[] = [];
  shapeRadius: number = 1; 

  invalidPoints: {[key: string]: boolean} = {}; 

  constructor(
    private route: ActivatedRoute, 
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(CanvasService) public canvasService: CanvasService
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

      if (!sessionStorage.getItem('canvasSessionActive')) {
        localStorage.removeItem('savedCanvasShapes');
        localStorage.removeItem('auth-token');
        console.log('Browser was closed and reopened - clearing saved shapes');
      }

      sessionStorage.setItem('canvasSessionActive', 'true');
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
      const shapes = this.canvasService.loadShapesFromLocalStorage();
      if (shapes && shapes.length > 0) {
        this.canvasService.restoreShapes(shapes);
        this.refreshDrawnShapesList();
      }
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
      
      setTimeout(() => {
        const savedShapes = this.canvasService.loadShapesFromLocalStorage();
        if (savedShapes && savedShapes.length > 0) {
          console.log('Setup complete, restoring shapes from localStorage');
          this.canvasService.restoreShapes(savedShapes);
          this.refreshDrawnShapesList();
        } else {
          console.log('No saved shapes found in localStorage');
        }
      }, 100);
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

  //Shape Management Methods

  refreshDrawnShapesList(): void {
    if (this.canvasInitialized) {
      const canvasShapes = this.canvasService.getDrawnShapes();
      console.log('Refreshed drawn shapes list:', canvasShapes);
      
      const placeholderShapes = this.drawnShapes.filter(s => s.isPlaceholder);
      
      this.drawnShapes = [...canvasShapes, ...placeholderShapes];
    }
  }

  getRequiredPointsCount(shapeType: string): number {
    switch (shapeType) {
      case 'triangle': return 3;
      case 'square': return 4;
      case 'rectangle': return 4; 
      case 'circle': return 1; 
      case 'polygon': return 3; // Minimum 3 points for a polygon
      default: return 0;
    }
  }

  onDrawShape(): void {
    if (!this.canvasInitialized) {
      alert('Canvas is not ready.');
      return;
    }

    if (this.editingShapeId) {
      const editingShape = this.drawnShapes.find(s => s.id === this.editingShapeId);
      if (editingShape && editingShape.isPlaceholder) {
        this.drawnShapes = this.drawnShapes.filter(s => s.id !== this.editingShapeId);
      }
      this.originalShapeDataBeforeEdit = null; 
    }

    const tempId = `temp-${Date.now()}`;
    
    const initialPoints: Point[] = [];
    
    const newShape: ShapeData = {
      id: tempId,
      type: this.selectedShapeType,
      name: `Новий ${this.selectedShapeType === 'square' ? 'квадрат' : this.selectedShapeType === 'triangle' ? 'трикутник' : this.selectedShapeType === 'rectangle' ? 'прямокутник' : this.selectedShapeType === 'circle' ? 'круг' : 'багатокутник'}`, 
      points: initialPoints,
      fillColor: this.defaultFillColor,
      borderColor: this.defaultBorderColor,
      isPlaceholder: true
    };

    if (this.selectedShapeType === 'circle') {
      initialPoints.push(new Point(0, 0)); 
      newShape.radius = 1; 
    }
    
    this.drawnShapes.push(newShape);
    
    this.editingShapeId = tempId;
    this.isNewShape = true;
    this.originalShapeDataBeforeEdit = null; 
    
    this.shapeName = newShape.name;
    this.shapeFillColor = newShape.fillColor;
    this.shapeBorderColor = newShape.borderColor;
    this.shapePoints = [...initialPoints];
    if (newShape.type === 'circle') {
      this.shapeRadius = newShape.radius !== undefined ? newShape.radius : 1;
    }
    
    this.updateTempShapeOnCanvas(newShape);
  }

  addPointToShape(shape: ShapeData): void {
    const newPoint = new Point(0, 0);
    
    shape.points.push(newPoint);
    
    this.validatePoint(shape, shape.points.length - 1);
    
    this.updateTempShapeOnCanvas(shape);
  }

  removePointFromShape(shape: ShapeData, index: number): void {
    if (index >= 0 && index < shape.points.length) {
      shape.points.splice(index, 1);
      
      this.validateAllPoints(shape); 
      this.updateTempShapeOnCanvas(shape);
    }
  }

  onSaveShape(): void {
    if (!this.editingShapeId) return;
    
    const shape = this.drawnShapes.find(s => s.id === this.editingShapeId);
    if (!shape) return;
    
    const requiredPoints = this.getRequiredPointsCount(shape.type);
    let pointsCheckFailed = false;
    let alertMessage = '';

    if (shape.type === 'polygon') {
      if (shape.points.length < requiredPoints) {
        pointsCheckFailed = true;
        alertMessage = `Фігура типу "багатокутник" потребує щонайменше ${requiredPoints} точки.`;
      }
    } else {
      if (shape.points.length !== requiredPoints) {
        pointsCheckFailed = true;
        alertMessage = `Фігура типу "${shape.type === 'square' ? 'квадрат' : shape.type === 'triangle' ? 'трикутник' : shape.type === 'rectangle' ? 'прямокутник' : 'круг'}" потребує рівно ${requiredPoints} ${shape.type === 'circle' ? 'точку (центр)' : 'точки'}.`;
      }
    }
    
    if (pointsCheckFailed) {
      alert(alertMessage);
      return;
    }

    if (shape.type === 'circle' && (shape.radius === undefined || shape.radius <= 0)) {
      alert('Радіус круга має бути позитивним числом.');
      return;
    }

    this.canvasService.setTempShape(null);
    let success = false;
    if (shape.isPlaceholder) {
      const newShapeId = this.canvasService.drawShape(
        shape.type, 
        shape.points,
        shape.fillColor, 
        shape.borderColor,
        shape.name,
        shape.radius 
      );
      success = newShapeId !== '';
    } else {
      success = this.canvasService.updateShape(
        shape.id,
        shape.type, 
        shape.points,
        shape.fillColor, 
        shape.borderColor,
        shape.name,
        shape.radius
      );
    }
    
    if (success) {
      if (shape.isPlaceholder) {
        this.drawnShapes = this.drawnShapes.filter(s => s.id !== this.editingShapeId);
      }

      this.canvasService.saveShapesToLocalStorage();
      
      this.refreshDrawnShapesList();
      
      this.editingShapeId = null;
      this.isNewShape = false;
      this.originalShapeDataBeforeEdit = null; 
    } else {
      alert('Не вдалося зберегти фігуру. Спробуйте ще раз.');
    }
  }

  onCancelEditShape(): void {
    if (!this.editingShapeId) return;

    this.canvasService.setTempShape(null); 

    const shapeBeingEdited = this.drawnShapes.find(s => s.id === this.editingShapeId);

    if (shapeBeingEdited) {
      if (shapeBeingEdited.isPlaceholder) {
        this.drawnShapes = this.drawnShapes.filter(s => s.id !== this.editingShapeId);
      } else if (this.originalShapeDataBeforeEdit && this.originalShapeDataBeforeEdit.id === shapeBeingEdited.id) {
        const originalPoints = this.originalShapeDataBeforeEdit.points.map(p => new Point(p.x, p.y));
        this.canvasService.updateShape(
          this.originalShapeDataBeforeEdit.id,
          this.originalShapeDataBeforeEdit.type,
          originalPoints, 
          this.originalShapeDataBeforeEdit.fillColor,
          this.originalShapeDataBeforeEdit.borderColor,
          this.originalShapeDataBeforeEdit.name,
          this.originalShapeDataBeforeEdit.radius 
        );
        const indexInDrawnShapes = this.drawnShapes.findIndex(s => s.id === this.originalShapeDataBeforeEdit!.id);
        if (indexInDrawnShapes !== -1) {
            this.drawnShapes[indexInDrawnShapes] = {
                ...this.originalShapeDataBeforeEdit,
                points: originalPoints, // ensure Point instances
                // radius is already part of originalShapeDataBeforeEdit
            };
        }
        
        this.canvasService.saveShapesToLocalStorage();
        this.refreshDrawnShapesList(); 
      }
    }

    this.editingShapeId = null;
    this.isNewShape = false;
    this.originalShapeDataBeforeEdit = null;
  }

  onEditShape(shape: ShapeData): void {
    if (this.editingShapeId === shape.id) {
      this.editingShapeId = null;
      this.isNewShape = false;
      this.originalShapeDataBeforeEdit = null; 
      this.canvasService.setTempShape(null);
    } else {
      if (this.editingShapeId) {
        const currentlyEditingShape = this.drawnShapes.find(s => s.id === this.editingShapeId);
        if (currentlyEditingShape && currentlyEditingShape.isPlaceholder) {
          
           this.drawnShapes = this.drawnShapes.filter(s => s.id !== this.editingShapeId);
        }
        this.canvasService.setTempShape(null); 
        this.originalShapeDataBeforeEdit = null; 
      }
      
      this.editingShapeId = shape.id;
      this.isNewShape = shape.isPlaceholder || false;

      if (!shape.isPlaceholder) {
        this.originalShapeDataBeforeEdit = JSON.parse(JSON.stringify(shape));
         
        if (this.originalShapeDataBeforeEdit) {
            this.originalShapeDataBeforeEdit.points = shape.points.map(p => new Point(p.x, p.y));
            
        }
      } else {
        this.originalShapeDataBeforeEdit = null;
      }
      
      this.shapeName = shape.name || '';
      this.shapeFillColor = shape.fillColor;
      this.shapeBorderColor = shape.borderColor;
      this.shapePoints = [...shape.points];
      if (shape.type === 'circle') {
        this.shapeRadius = shape.radius !== undefined ? shape.radius : 1;
      }
      
      this.canvasService.saveShapesToLocalStorage();
      this.updateTempShapeOnCanvas(shape);
    }
  }

  onDeleteShape(shapeId: string): void {
    if (!this.canvasInitialized) return;
    
    const shape = this.drawnShapes.find(s => s.id === shapeId);
    if (!shape) return;
    
    if (this.editingShapeId === shapeId) {
      this.canvasService.setTempShape(null);
      this.editingShapeId = null;
      this.isNewShape = false;
    }
    
    this.drawnShapes = this.drawnShapes.filter(s => s.id !== shapeId);
    
    if (!shape.isPlaceholder) {
      this.canvasService.deleteShape(shapeId);
      this.refreshDrawnShapesList();
    }
  }

  updateShapeProperty(property: string, value: any): void {
    if (!this.editingShapeId) return;
    
    const shape = this.drawnShapes.find(s => s.id === this.editingShapeId);
    if (!shape) return;
    
    if (property === 'name') {
      shape.name = value;
    } else if (property === 'fillColor') {
      shape.fillColor = value;
      this.updateTempShapeOnCanvas(shape); 
    } else if (property === 'borderColor') {
      shape.borderColor = value;
      this.updateTempShapeOnCanvas(shape); 
    } else if (property.startsWith('point-')) {
      const [_, indexStr, coord] = property.split('-');
      const index = parseInt(indexStr);
      
      if (!isNaN(index) && index >= 0 && index < shape.points.length) {
        if (coord === 'x') {
          shape.points[index].x = parseFloat(value);
          this.validatePoint(shape, index);
          this.updateTempShapeOnCanvas(shape); 
        } else if (coord === 'y') {
          shape.points[index].y = parseFloat(value);
          this.validatePoint(shape, index);
          this.updateTempShapeOnCanvas(shape); 
        }
      }
    } else if (property === 'radius') {
      shape.radius = parseFloat(value);
      this.validateAllPoints(shape); 
      this.updateTempShapeOnCanvas(shape);
    }
    
  }

  validatePoint(shape: ShapeData, index: number): void {
    let isValid = true;

    if (shape.type === 'square') {
      isValid = validateSquarePoints(shape.points, index);
    } else if (shape.type === 'triangle') {
      isValid = validateTrianglePoints(shape.points, index);
    } else if (shape.type === 'rectangle') {
      isValid = validateRectanglePoints(shape.points, index);
    } else if (shape.type === 'circle') {
      isValid = validateCircleData(shape.points, shape.radius, index);
    } else if (shape.type === 'polygon') {
      isValid = validatePolygonPoints(shape.points, index);
    }
    
    const pointKey = `${shape.id}-${index}`;
    this.invalidPoints[pointKey] = !isValid;
  }
  
  checkShapeValidity(shape: ShapeData): boolean {
    for (let i = 0; i < shape.points.length; i++) {
      const pointKey = `${shape.id}-${i}`;
      if (this.invalidPoints[pointKey]) {
        return false; 
      }
    }
    return true;
  }

  validateAllPoints(shape: ShapeData): void {
    for (let i = 0; i < shape.points.length; i++) {
      const pointKey = `${shape.id}-${i}`;
      delete this.invalidPoints[pointKey]; 
    }

    for (let i = 0; i < shape.points.length; i++) {
      let isValid = true;
      if (shape.type === 'square') {
        isValid = validateSquarePoints(shape.points, i);
      } else if (shape.type === 'triangle') {
        isValid = validateTrianglePoints(shape.points, i);
      } else if (shape.type === 'rectangle') { 
        isValid = validateRectanglePoints(shape.points, i);
      } else if (shape.type === 'circle') {
        
        isValid = validateCircleData(shape.points, shape.radius, i); 
      } else if (shape.type === 'polygon') {
        isValid = validatePolygonPoints(shape.points, i);
      }
      const pointKey = `${shape.id}-${i}`;
      this.invalidPoints[pointKey] = !isValid;
    }
  }
  
  isPointValid(shapeId: string, pointIndex: number): boolean {
    const pointKey = `${shapeId}-${pointIndex}`;
    return !this.invalidPoints[pointKey];
  }
  
  isShapeValid(shape: ShapeData): boolean {
    if (shape.type === 'polygon') {
      if (shape.points.length < this.getRequiredPointsCount(shape.type)) {
        return false;
      }
    } else {
      if (shape.points.length !== this.getRequiredPointsCount(shape.type)) {
        return false;
      }
    }
    if (shape.type === 'circle' && (shape.radius === undefined || shape.radius <= 0)) {
        return false; 
    }
    this.validateAllPoints(shape); 
    return this.checkShapeValidity(shape);
  }
  
  private updateTempShapeOnCanvas(shape: ShapeData): void {
    if (this.canvasInitialized && shape) {
      const tempShape = { 
        ...shape, 
        isPlaceholder: true 
      };
      this.canvasService.setTempShape(tempShape);
    }
  }

  switchPanel(panel: 'shapes' | 'tasks'): void {
    if (panel === 'tasks' && this.editingShapeId) {
      this.onCancelEditShape();
    }
    this.activePanel = panel;
  }

  
}
