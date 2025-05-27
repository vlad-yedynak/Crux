import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { TimeTrackerService } from '../../services/time-tracker.service';
import { AuthServiceService, User } from '../../services/auth-service.service';
// Make sure Card interface in LessonsService can accommodate tasks if not already
import { LessonsService, Card, Task } from '../../services/lessons.service';
import { CookiesService } from '../../services/cookies.service';
import { CanvasCurveService } from './services/canvas-curve.service';
import { ConfigService } from '../../services/config.service';

interface Point {
  x: number;
  y: number;
}

interface Curve {
  id: string;
  type: 'quadratic' | 'cubic';
  name: string;
  points: Point[];
  color: string;
  isPlaceholder?: boolean;
  tValue?: number; // Add this property for slider value (0-100)
}

@Component({
  selector: 'app-sandbox-card-bezier',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './sandbox-card-bezier.component.html',
  styleUrl: './sandbox-card-bezier.component.css',
  providers: [CanvasCurveService],
  animations: [
    trigger('slideTogglePanel', [
      state('void', style({
        opacity: 0,
        maxHeight: '0px',
        paddingTop: '0px',
        paddingBottom: '0px',
        marginTop: '0px',
      })),
      state('*', style({
        opacity: 1,
        maxHeight: '500px',
        paddingTop: '10px',
        paddingBottom: '10px',
        marginTop: '8px',
      })),
      transition('void <=> *', [
        animate('300ms ease-in-out')
      ])
    ])
  ]
})
export class SandboxCardBezierComponent implements OnInit, AfterViewInit, OnDestroy {
  card: Card | null = null;
  private canvasInitialized = false;
  activePanel: 'curves' | 'tasks' = 'curves';

  @ViewChild('myCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasContainer') containerRef!: ElementRef<HTMLElement>;

  // Curve management properties
  drawnCurves: Curve[] = [];
  selectedCurveType: 'quadratic' | 'cubic' = 'quadratic';
  editingCurveId: string | null = null;
  private tempCurveHolder: Curve | null = null; // To hold original state during edit

  selectedTask: Task | null = null;
  taskAnswers: any[] = [];

  showResultsPopup = false;
  taskResultCorrect = false;

  isAuthenticated: boolean = false;
  showAuthMessage: boolean = false;
  redirectCountdown: number = 3;
  private redirectTimer: any = null;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private authService: AuthServiceService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private canvasCurveService: CanvasCurveService,
    private timeTrackerService: TimeTrackerService,
    private lessonsService: LessonsService,
    public router: Router,
    private cookiesService: CookiesService,
    private configService: ConfigService
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
        
        const lessonId = localStorage.getItem('selectedLessonId');
        if (lessonId) {
          this.timeTrackerService.startTracking(cardIdNum, parseInt(lessonId, 10));
        }
      }
      // Initialize activePanel based on tasks after card details are fetched
    }
  }

  ngOnDestroy(): void {
    this.timeTrackerService.stopTracking();
    
    // Clean up global function
    if (this.isBrowser()) {
      delete (window as any).redrawAllCurves;
      localStorage.removeItem('selectedCardId');
      localStorage.removeItem('selectedLessonId');
    }
  }

  ngAfterViewInit(): void {
    if (this.isBrowser()) {
      setTimeout(() => {
        this.setupCanvasIfReady();
        this.setupCanvasClickHandler();
        
        // Add global redraw function for point dragging
        (window as any).redrawAllCurves = () => {
          this.redrawCanvas();
        };
      }, 100);
    }
  }

  private setupCanvasClickHandler(): void {
    if (!this.isBrowser() || !this.canvasRef || !this.canvasRef.nativeElement) return;
    
    this.canvasRef.nativeElement.addEventListener('click', (event: MouseEvent) => {
      // Only process clicks when we are editing a curve
      if (!this.editingCurveId) return;
      
      // Don't add points if we were just dragging the canvas
      if (this.canvasCurveService.wasDraggingRecently()) {
        this.canvasCurveService.resetDragState();
        console.log('Ignoring click after drag');
        return;
      }
      
      // First check if we're clicking on an existing point
      const isPointClicked = this.canvasCurveService.isPointClicked(event);
      
      if (!isPointClicked) {
        // Only add a new point if we didn't click on an existing one
        const worldCoordinates = this.canvasCurveService.handleCanvasClick(event);
        if (worldCoordinates) {
          console.log('Adding point at', worldCoordinates.x, worldCoordinates.y);
          this.addPointToCurve(worldCoordinates);
        }
      }
    });
  }

  addPointToCurve(point: {x: number, y: number}): void {
    if (!this.editingCurveId) return;
    
    const curve = this.drawnCurves.find(c => c.id === this.editingCurveId);
    if (curve) {
      curve.points.push({
        x: Math.round(point.x * 100) / 100, // Round to 2 decimal places
        y: Math.round(point.y * 100) / 100
      });
      
      this.redrawCanvas();
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    if (!this.isBrowser() || !this.canvasInitialized) return;

    // Оновлюємо розмір canvas
    this.updateCanvasSize();

    // Скидаємо масштаб і положення до дефолтних (як у sandbox-card)
    if (this.canvasCurveService && (this.canvasRef?.nativeElement)) {
      // Примусово створюємо новий контролер з дефолтним scale та position
      // (це робить initializeCanvas)
      // Тому просто перемальовуємо всі криві
      this.canvasCurveService.drawCurvesList(this.drawnCurves, this.editingCurveId);
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
        // Тут scale і position завжди дефолтні, як у sandbox-card
        this.canvasCurveService.initializeCanvas(this.canvasRef, width, height);
      }
    }
  }

  private setupCanvasIfReady(): void {
    if (!this.isBrowser()) return;
    
    if (
      !this.canvasInitialized &&
      this.canvasRef && this.canvasRef.nativeElement &&
      this.containerRef && this.containerRef.nativeElement
    ) {
      this.updateCanvasSize();
      this.canvasInitialized = true;
      this.redrawCanvas(); // Initial draw
      
      console.log('Canvas setup complete.');
    }
  }

  fetchCardDetails(cardId: number): void {
    if (!this.isBrowser()) return;
    
    this.lessonsService.getCardById(cardId).subscribe({
      next: (cardData) => { 
        if (cardData) {
          console.log('Card details received in SandboxCardBezierComponent:', cardData);
          this.card = cardData;
          
          // Always set the active panel to 'curves' on initialization
          this.activePanel = 'curves';
          
          if (cardData.lessonId) {
            localStorage.setItem('selectedLessonId', cardData.lessonId.toString());
          }
          
          setTimeout(() => this.setupCanvasIfReady(), 100);
        } else {
          console.error(`SandboxCardBezierComponent: Failed to fetch card details for ID ${cardId} from service.`);
        }
      },
      error: (err) => {
        console.error(`SandboxCardBezierComponent: Error fetching card details for ID ${cardId}:`, err);
      }
    });
  }

  // --- Curve Management Methods ---

  getRequiredPointsCount(type: 'quadratic' | 'cubic'): number {
    switch (type) {
      case 'quadratic': return 3; // P0, P1 (control), P2
      case 'cubic': return 4;     // P0, P1 (control), P2 (control), P3
      default: return 0;
    }
  }

  onDrawCurve(): void {
    if (this.editingCurveId) {
      const existingCurve = this.drawnCurves.find(c => c.id === this.editingCurveId);
      if (existingCurve?.isPlaceholder) {
        this.onCancelEditCurve();
      } else {
        console.warn("Please save or cancel the current curve editing.");
        return;
      }
    }

    const newCurveId = `curve_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newCurve: Curve = {
      id: newCurveId,
      type: this.selectedCurveType,
      name: `${this.selectedCurveType.charAt(0).toUpperCase() + this.selectedCurveType.slice(1)} Curve ${this.drawnCurves.length + 1}`,
      points: [], // Start with empty points array
      color: '#FF5722',
      isPlaceholder: true,
      tValue: 0, // Initialize tValue to 0
    };

    this.drawnCurves.push(newCurve);
    this.editingCurveId = newCurve.id;
    this.tempCurveHolder = JSON.parse(JSON.stringify(newCurve));
    this.redrawCanvas();
  }

  onEditCurve(curve: Curve): void {
    if (this.editingCurveId && this.editingCurveId !== curve.id) {
      // If editing another curve, handle the current one (e.g., auto-save or prompt)
      // For simplicity, let's assume we save the current one or cancel if placeholder
      const currentEditing = this.drawnCurves.find(c => c.id === this.editingCurveId);
      if (currentEditing?.isPlaceholder) {
        this.onCancelEditCurve();
      } else if (currentEditing) {
        this.onSaveCurve(); // Auto-save previous
      }
    }
    this.editingCurveId = curve.id;
    this.tempCurveHolder = JSON.parse(JSON.stringify(curve)); // Store for cancellation
    this.redrawCanvas(); // Highlight or focus on the curve being edited if service supports
  }

  onDeleteCurve(curveId: string): void {
    this.drawnCurves = this.drawnCurves.filter(c => c.id !== curveId);
    if (this.editingCurveId === curveId) {
      this.editingCurveId = null;
      this.tempCurveHolder = null;
    }
    this.redrawCanvas();
  }

  onSaveCurve(): void {
    if (!this.editingCurveId) return;
    const curve = this.drawnCurves.find(c => c.id === this.editingCurveId);
    if (curve) {
      if (!this.isCurveValid(curve)) {
        console.error("Curve is not valid. Cannot save.");
        // Optionally show a user message
        return;
      }
      delete curve.isPlaceholder;
      this.editingCurveId = null;
      this.tempCurveHolder = null;
      
      // Force a full redraw to immediately clear control points and dashed lines
      this.canvasCurveService.clearCanvas(true);
      this.redrawCanvas();
      
      console.log('Curve saved:', curve);
    }
  }

  onCancelEditCurve(): void {
    if (!this.editingCurveId) return;
    const curveIndex = this.drawnCurves.findIndex(c => c.id === this.editingCurveId);
    if (curveIndex !== -1) {
      if (this.drawnCurves[curveIndex].isPlaceholder) {
        this.drawnCurves.splice(curveIndex, 1); // Remove placeholder
      } else if (this.tempCurveHolder) {
        // Restore original state for non-placeholder curves
        this.drawnCurves[curveIndex] = JSON.parse(JSON.stringify(this.tempCurveHolder));
      }
    }
    this.editingCurveId = null;
    this.tempCurveHolder = null;
    this.redrawCanvas();
  }

  updateCurveProperty(propertyName: string, value: any): void {
    if (!this.editingCurveId) return;
    const curve = this.drawnCurves.find(c => c.id === this.editingCurveId);
    if (curve) {
      const parts = propertyName.split('-');
      if (parts[0] === 'point' && parts.length === 3) { // e.g., point-0-x
        const pointIndex = parseInt(parts[1], 10);
        const coordinate = parts[2] as 'x' | 'y';
        if (curve.points[pointIndex]) {
          curve.points[pointIndex][coordinate] = parseFloat(value) || 0;
        }
      } else {
        (curve as any)[propertyName] = value;
      }
      this.redrawCanvas();
    }
  }
  
  isCurveValid(curve: Curve | null): boolean {
    if (!curve) return false;
    if (!curve.name || curve.name.trim() === '') return false;
    
    // For valid Bezier curves, we need a minimum number of points
    const minPoints = curve.type === 'quadratic' ? 3 : 4;
    
    // Allow saving if we have at least 2 points, but show hint for optimal points
    if (curve.points.length < 2) return false;

    for (const point of curve.points) {
      if (typeof point.x !== 'number' || typeof point.y !== 'number' || isNaN(point.x) || isNaN(point.y)) {
        return false;
      }
    }
    return true;
  }

  // Add a method to check if the curve has optimal number of points
  hasOptimalPointCount(curve: Curve | null): boolean {
    if (!curve) return false;
    
    const minPoints = curve.type === 'quadratic' ? 3 : 4;
    return curve.points.length >= minPoints;
  }

  // Helper methods for template
  isValidationWarningForPoints(curve: Curve): boolean {
    return this.isCurveValid(curve) && !this.hasOptimalPointCount(curve);
  }
  
  redrawCanvas(): void {
    if (!this.isBrowser() || !this.canvasInitialized || !this.canvasCurveService || !this.canvasRef?.nativeElement) {
      return;
    }
    this.canvasCurveService.clearCanvas(false);
    
    // Ensure all curves are drawn, including those with single points
    this.canvasCurveService.drawCurvesList(this.drawnCurves, this.editingCurveId);
    
    // If we're editing a curve and it has only one point, make sure it's visible
    if (this.editingCurveId) {
      const editingCurve = this.drawnCurves.find(c => c.id === this.editingCurveId);
      if (editingCurve) {
        if (editingCurve.points.length === 1) {
          this.canvasCurveService.drawSinglePoint(editingCurve.points[0], editingCurve.color);
        }
        // Draw the t-value demonstration point if there are at least 2 points
        else if (editingCurve.points.length >= 2 && editingCurve.tValue !== undefined) {
          const tValue = editingCurve.tValue / 100; // Convert to 0-1 range
          this.canvasCurveService.drawPointAtT(editingCurve, tValue);
        }
      }
    }
  }

  // Helper method to explicitly draw a single point if needed
  // This should be called by the CanvasCurveService, but we're adding it as a fallback
  drawSinglePoint(point: Point, color: string): void {
    if (!this.canvasCurveService || !this.canvasRef?.nativeElement) return;
    
    this.canvasCurveService.drawSinglePoint(point, color);
  }

  // --- End Curve Management Methods ---

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

  submitTaskAnswer(): void {
    if (this.selectedTask) {
      let token: string | null = null;
      if (this.isBrowser()) {
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
        this.configService.getEndpoint('/test/validate-task'),
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

  closeResultsPopup(forceDeselectTask: boolean = false): void {
    this.showResultsPopup = false;
    if (this.taskResultCorrect || forceDeselectTask) {
      this.deselectTask();
    }
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
        return 'text'; // bool will be handled by a select or radio buttons in template
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

  switchPanel(panel: 'curves' | 'tasks'): void {
    this.activePanel = panel;
    if (panel === 'curves') {
      // Ensure canvas is ready and redraw curves when switching to curves panel
      setTimeout(() => {
        this.setupCanvasIfReady();
        this.redrawCanvas();
      }, 0);
    }
  }

  // Helper methods for template
  isEditingCurveWithLessThanTwoPoints(): boolean {
    if (!this.editingCurveId) return false;
    const curve = this.drawnCurves.find(c => c.id === this.editingCurveId);
    return curve ? curve.points.length < 2 : false;
  }

  isEditingCurveWithTwoOrMorePoints(): boolean {
    if (!this.editingCurveId) return false;
    const curve = this.drawnCurves.find(c => c.id === this.editingCurveId);
    return curve ? curve.points.length >= 2 : false;
  }

  isValidationErrorForPoints(curve: Curve): boolean {
    return !this.isCurveValid(curve) && curve.points.length < 2;
  }

  isValidationErrorForName(curve: Curve): boolean {
    return !this.isCurveValid(curve) && (!curve.name || curve.name.trim() === '');
  }

  /**
   * Delete a point from a curve
   * @param curve The curve to modify
   * @param pointIndex The index of the point to delete
   */
  deletePoint(curve: Curve, pointIndex: number): void {
    // Don't allow deleting points if there are only 2 (minimum required)
    if (curve.points.length <= 2) {
      return;
    }

    // Remove the point at the specified index
    curve.points.splice(pointIndex, 1);

    // Update the curve in the UI
    this.updateCurveProperty('points', curve.points);
    
    // Redraw the curve
    this.redrawCanvas();
  }

  // Add this method to handle slider changes
  updateCurveVisualization(curve: Curve): void {
    if (!curve.tValue) {
      curve.tValue = 0;
    }
    this.redrawCanvas();
  }
}
