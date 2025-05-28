import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CanvasService, Point, ShapeData, validateSquarePoints, validateTrianglePoints, validateRectanglePoints, validateCircleData, validatePolygonPoints } from './services/canvas.service'; 
import { FormsModule } from '@angular/forms';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { TimeTrackerService } from '../../services/time-tracker.service';
import { AuthServiceService, User } from '../../services/auth-service.service';
import { LessonsService, Card, Task } from '../../services/lessons.service'; // Import Card and Task
import { CookiesService } from '../../services/cookies.service';
import { ConfigService } from '../../services/config.service'; // Added import

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
        maxHeight: '0px',
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
export class SandboxCardComponent implements OnInit, AfterViewInit, OnDestroy {
  card: Card | null = null; // Uses Card from LessonsService
  private canvasInitialized = false;
  activePanel: 'shapes' | 'tasks' = 'shapes';  // Removed 'curves'

  @ViewChild('myCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasContainer') containerRef!: ElementRef<HTMLElement>;

  selectedTask: Task | null = null; 
  taskAnswers: any[] = [];

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

  showResultsPopup = false;
  taskResultCorrect = false;

  // Add variables for auth check
  isAuthenticated: boolean = false;
  showAuthMessage: boolean = false;
  redirectCountdown: number = 3;
  
  // Add a reference to the redirect timer
  private redirectTimer: any = null;
  
  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private authService: AuthServiceService,
    @Inject(PLATFORM_ID) private platformId: Object,
    public canvasService: CanvasService,
    private timeTrackerService: TimeTrackerService,
    private lessonsService: LessonsService,
    public router: Router,
    private cookiesService: CookiesService,
    private configService: ConfigService // Injected ConfigService
  ) { }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser()) {
      const cardId = localStorage.getItem('selectedCardId');
      if (cardId) {
        const cardIdNum = parseInt(cardId, 10);
        this.fetchCardDetails(+cardId);
        // Start time tracking
        const lessonId = localStorage.getItem('selectedLessonId');
        if (lessonId) {
          this.timeTrackerService.startTracking(cardIdNum, parseInt(lessonId, 10));
        }
      }

      if (!sessionStorage.getItem('canvasSessionActive')) {
        localStorage.removeItem('savedCanvasShapes');
        localStorage.removeItem('auth-token');
        console.log('Browser was closed and reopened - clearing saved shapes');
      }

      sessionStorage.setItem('canvasSessionActive', 'true');
      
      // Це не завжди спрацює при початковій завантаженні, так як card може ще не бути завантажений
      console.log('Initial sandboxType:', this.card?.sandboxType);
    }
  }

  ngOnDestroy(): void {
    // Stop time tracking
    this.timeTrackerService.stopTracking();
    
    // Clear selected card and lesson from localStorage
    if (this.isBrowser()) {
      localStorage.removeItem('selectedCardId');
      localStorage.removeItem('selectedLessonId');
    }
  }

  ngAfterViewInit(): void {
    if (this.isBrowser()) {
      setTimeout(() => this.setupCanvasIfReady(), 100);
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    if (!this.isBrowser() || !this.canvasInitialized) return;
    
    this.updateCanvasSize();
    
    const shapes = this.canvasService.loadShapesFromLocalStorage();
    if (shapes && shapes.length > 0) {
      this.canvasService.restoreShapes(shapes);
      this.refreshDrawnShapesList();
    }
  }

  private updateCanvasSize(): void {
    if (!this.isBrowser()) return;
    
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
    // Skip if not in browser
    if (!this.isBrowser()) return;
    
    if (
      this.card?.sandboxType === 'Primitives' &&
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
    if (!this.isBrowser()) return;
    
    this.lessonsService.getCardById(cardId).subscribe({
      next: (cardData) => { 
        if (cardData) {
          console.log('Card details received in SandboxCardComponent:', cardData);
          this.card = cardData;
          
          // Установка правильної активної панелі
          this.activePanel = 'shapes';
          
          if (cardData.lessonId) {
            localStorage.setItem('selectedLessonId', cardData.lessonId.toString());
          }
          
          setTimeout(() => this.setupCanvasIfReady(), 100);
        } else {
          console.error(`SandboxCardComponent: Failed to fetch card details for ID ${cardId} from service.`);
        }
      },
      error: (err) => {
        console.error(`SandboxCardComponent: Error fetching card details for ID ${cardId}:`, err);
      }
    });
  }

  selectTask(task: Task): void {
    this.selectedTask = task;
    if(task.expectedDataCount && task.expectedDataType){
      this.taskAnswers = new Array(task.expectedDataCount).fill(undefined);
    }else{
      this.taskAnswers = [];
    }
  }

  deselectTask(): void {
    this.selectedTask = null;
    this.taskAnswers = [];
  }

  getDataTypeLabel(dataType: string): string {
    switch (dataType.toLowerCase()) {
      case 'int': return 'Ціле число (Integer)';
      case 'double': return 'Дробове число (Double)';
      case 'string': return 'Текст (String)';
      case 'bool': return 'Логічне значення (Boolean)';
      default: return dataType; 
    }
  }

  getInputType(dataType: string): string {
    switch (dataType.toLowerCase()) {
      case 'int':
      case 'double':
        return 'number';
      case 'string':
        return 'text';
      default:
        return 'text';
    }
  }

  getPlaceholder(dataType: string): string {
     switch (dataType.toLowerCase()) {
      case 'int': return 'напр. 123';
      case 'double': return 'напр. 12.34';
      case 'string': return 'напр. Текстова відповідь';
      default: return 'Введіть значення';
    }
  }

  submitTaskAnswer(): void {
    if (this.selectedTask) {
      let token: string | null = null;
      if (isPlatformBrowser(this.platformId)) {
        token = this.cookiesService.getCookie('auth-token');
      }
      console.log(`token:`, token);
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      const inputDataArray: any[] = [];
      if(this.selectedTask.expectedDataCount && this.selectedTask.expectedDataType) {
        for (let i = 0; i < this.selectedTask.expectedDataCount; i++) {
          const dataType = this.selectedTask.expectedDataType[i];
          const answer = this.taskAnswers[i];
          const entry: any = {}; // Changed from [] to {}

          switch (dataType.toLowerCase()) {
            case 'int':
              entry.valueInt = (answer === undefined || answer === null || answer === '' || isNaN(Number(answer))) ? null : Number(answer);
              break;
            case 'double':
              entry.valueDouble = (answer === undefined || answer === null || answer === '' || isNaN(Number(answer))) ? null : Number(answer);
              break;
            case 'string':
              entry.valueString = (answer === undefined || answer === null || answer === '') ? null : String(answer).trim();
              break;
            case 'bool':
              if (answer === undefined || answer === null || answer === ''){
                entry.valueBool = null;
              }else{
                entry.valueBool = String(answer).toLowerCase() === 'true';
              }
              break;
            default:
              console.warn(`Невідомий тип даних: ${dataType}`);
              break;
          } 
  

          if(Object.keys(entry).length > 0){
            inputDataArray.push(entry)
          }
        }
      }
      
      const payload = {
        taskId: this.selectedTask.id,
        inputData: inputDataArray
      };
      console.log('Submitting task answer with payload:', JSON.stringify(payload, null, 2));

      this.http.post<{ body: boolean; success: boolean; error: string | null }>(
        this.configService.getEndpoint('/test/validate-task'), // Replaced hardcoded URL
        payload,
        { headers }
      ).subscribe({
        next: (response) => {
          if (response.success) {
            const isCorrect = response.body;
            
            this.taskResultCorrect = isCorrect;
            // this.showResultsPopup = true; // Moved after card refresh
            
            if (isCorrect) {
              if (this.selectedTask) {
                this.selectedTask.isCompleted = true;
              }
              
              if (this.card && this.card.tasks) {
                const taskInList = this.card.tasks.find(t => t.id === this.selectedTask!.id);
                if (taskInList) {
                  taskInList.isCompleted = true;
                }
              }

              this.authService.forceRefreshUserData().subscribe({
                next: (updatedUser: User | null) => {
                  if (updatedUser) {
                    console.log('User data refreshed after correct task answer. New score:', updatedUser.scorePoints);
                  } else {
                    console.warn('User data refresh after task did not return a user.');
                  }
                },
                error: (err) => {
                  console.error('Error refreshing user data after task:', err);
                }
              });
            }
          } else {
            this.taskResultCorrect = false;
            console.error(`Validation error: ${response.error}`);
          }

          if (this.card && this.card.id) {
            this.lessonsService.forceRefreshCardById(this.card.id).subscribe({
              next: (refreshedCard) => {
                if (refreshedCard) {
                  this.card = refreshedCard;
                  if (this.selectedTask && this.card && this.card.tasks) {
                    const updatedSelectedTask = this.card.tasks.find(t => t.id === this.selectedTask!.id);
                    if (updatedSelectedTask) {
                      this.selectedTask = updatedSelectedTask;
                    }
                  }
                  console.log('Card data refreshed after task submission.');
                } else {
                  console.warn('Failed to refresh card data after task submission.');
                }
                this.showResultsPopup = true; 
              },
              error: (refreshError) => {
                console.error('Error refreshing card data after task submission:', refreshError);
                this.showResultsPopup = true; 
              }
            });
          } else {
            console.warn('Card ID is not available, cannot refresh card data. Showing popup directly.');
            this.showResultsPopup = true;
          }
        },
        error: (err) => {
          console.error('Error validating task answer:', err);
          this.taskResultCorrect = false;
          this.showResultsPopup = true;
        }
      });
    }
  }

  // Add method to close the popup
  closeResultsPopup(forceDeselectTask: boolean = false): void {
    this.showResultsPopup = false;
    if (this.taskResultCorrect || forceDeselectTask) {
      this.deselectTask();
    }
  }

  //Shape Management Methods

  refreshDrawnShapesList(): void {
    if (!this.isBrowser() || !this.canvasInitialized) return;
    
    const canvasShapes = this.canvasService.getDrawnShapes();
    console.log('Refreshed drawn shapes list:', canvasShapes);
    
    const placeholderShapes = this.drawnShapes.filter(s => s.isPlaceholder);
    
    this.drawnShapes = [...canvasShapes, ...placeholderShapes];
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
    if (!this.isBrowser() || !this.canvasInitialized) {
      if (this.isBrowser()) alert('Canvas is not ready.');
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
    if (!this.isBrowser() || !this.canvasInitialized) return;
    
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
    if (!this.isBrowser() || !this.canvasInitialized || !shape) return;
    
    const tempShape = { 
      ...shape, 
      isPlaceholder: true 
    };
    this.canvasService.setTempShape(tempShape);
  }
  
  switchPanel(panel: 'shapes' | 'tasks'): void {
    this.activePanel = panel;
  }

  @HostListener('window:load')
  onPageLoad(): void {
    if (this.isBrowser()) {
      // Check if this is a page refresh
      const isPageRefresh = this.isPageRefresh();
      
      if (isPageRefresh) {
        const cardId = localStorage.getItem('selectedCardId');
        if (cardId) {
          console.log('Page was refreshed - forcing sandbox card data update from server');
          this.forceRefreshCardData(parseInt(cardId, 10));
        }
      }
    }
  }
  
  // Helper method to detect if current page load is a refresh
  private isPageRefresh(): boolean {
    // Use multiple methods to detect refresh for better browser compatibility
    
    // Method 1: Using Performance API navigation type (modern browsers)
    if (window.performance) {
      if (window.performance.getEntriesByType) {
        const navigationEntries = window.performance.getEntriesByType('navigation');
        if (navigationEntries.length > 0) {
          return (navigationEntries[0] as any).type === 'reload';
        }
      }
      
      // Method 2: Older Performance API (fallback)
      if (window.performance.navigation) {
        return window.performance.navigation.type === 1; // 1 is TYPE_RELOAD
      }
    }
    
    // If we can't detect it reliably, default to false
    return false;
  }

  // Method to force refresh card data from server
  private forceRefreshCardData(cardId: number): void {
    console.log(`SandboxCardComponent: Forcing refresh for card ${cardId} from server`);
    
    this.lessonsService.forceRefreshCardById(cardId).subscribe({
      next: (cardData) => {
        if (cardData) {
          console.log('Card details refreshed from server in SandboxCardComponent:', cardData);
          this.card = cardData;
          
          // Установка правильної активної панелі
          this.activePanel = 'shapes';
          
          if (cardData.lessonId) {
            localStorage.setItem('selectedLessonId', cardData.lessonId.toString());
          }
          
          setTimeout(() => this.setupCanvasIfReady(), 100);
        } else {
          console.error(`SandboxCardComponent: Failed to fetch fresh card details for ID ${cardId} from service.`);
        }
      },
      error: (err) => {
        console.error(`SandboxCardComponent: Error refreshing card details for ID ${cardId}:`, err);
        
        // Try to load from cache as fallback
        const storedCardId = localStorage.getItem('selectedCardId');
        if (storedCardId) {
          this.fetchCardDetails(parseInt(storedCardId, 10));
        }
      }
    });
  }
}
