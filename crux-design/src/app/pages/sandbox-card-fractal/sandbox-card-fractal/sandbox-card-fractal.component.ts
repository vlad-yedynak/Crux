import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, Inject, PLATFORM_ID, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { CanvasFractalService, Point } from '../services/canvas-fractal.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { TimeTrackerService } from '../../../services/time-tracker.service';
import { AuthServiceService, User } from '../../../services/auth-service.service';
import { LessonsService, Card, Task } from '../../../services/lessons.service';
import { CookiesService } from '../../../services/cookies.service';
import { ConfigService } from '../../../services/config.service';

interface FractalPoint {
  x: number;
  y: number;
}

interface FractalParameter {
  name: string;
  value: number;
  min: number;
  max: number;
  step: number;
}

interface Fractal {
  id: string;
  name: string;
  type: string;
  color: string;
  parameters: FractalParameter[];
  isPlaceholder?: boolean;
}

@Component({
  selector: 'app-sandbox-card-fractal',
  templateUrl: './sandbox-card-fractal.component.html',
  styleUrls: ['./sandbox-card-fractal.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule],
  animations: [
    trigger('slideTogglePanel', [
      state('void', style({
        height: '0',
        opacity: '0',
        padding: '0 10px',
        margin: '0'
      })),
      state('*', style({
        height: '*',
        opacity: '1'
      })),
      transition('void <=> *', [
        animate('300ms ease-in-out')
      ])
    ])
  ]
})
export class SandboxCardFractalComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('myCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasContainer') containerRef!: ElementRef;
  
  activePanel: string = 'fractals';
  selectedFractalType: string = 'mandelbrot';
  drawnFractals: Fractal[] = [];
  editingFractalId: string | null = null;
  canvas: HTMLCanvasElement | null = null;
  ctx: CanvasRenderingContext2D | null = null;
  showAuthMessage = false;
  isBrowser: boolean;
  
  // Task-related properties
  card: Card | null = null;
  selectedTask: Task | null = null;
  taskAnswers: any[] = [];
  showResultsPopup = false;
  taskResultCorrect = false;
  
  fractalTypes = [
    { value: 'mandelbrot', label: 'Множина Мандельброта' },
    { value: 'julia', label: 'Множина Жюліа' },
    { value: 'sierpinski', label: 'Трикутник Серпінського' },
    { value: 'koch', label: 'Сніжинка Коха' },
    { value: 'barnsley', label: 'Папороть Барнслі' }
  ];
  
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private canvasService: CanvasFractalService,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private timeTrackerService: TimeTrackerService,
    private authService: AuthServiceService,
    private lessonsService: LessonsService,
    private cookiesService: CookiesService,
    private configService: ConfigService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    // Initialize component
    if (this.isBrowser) {
      const cardId = localStorage.getItem('selectedCardId');
      if (cardId) {
        const cardIdNum = parseInt(cardId, 10);
        this.fetchCardDetails(+cardId);
        
        const lessonId = localStorage.getItem('selectedLessonId');
        if (lessonId) {
          this.timeTrackerService.startTracking(cardIdNum, parseInt(lessonId, 10));
        }
      }
    }
  }

  ngAfterViewInit(): void {
    // Setup canvas after view is initialized, only in browser environment
    if (this.isBrowser) {
      setTimeout(() => {
        this.setupCanvas();
      }, 0);
    }
  }

  ngOnDestroy(): void {
    // Clean up resources when component is destroyed
    if (this.isBrowser && this.handleResize) {
      window.removeEventListener('resize', this.handleResize);
    }
    this.timeTrackerService.stopTracking();
    
    if (this.isBrowser) {
      localStorage.removeItem('selectedCardId');
      localStorage.removeItem('selectedLessonId');
    }
  }

  private setupCanvas(): void {
    if (!this.isBrowser || !this.canvasRef || !this.containerRef) return;
    
    this.canvas = this.canvasRef.nativeElement;
    if (!this.canvas) return;
    
    const container = this.containerRef.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Initialize the canvas through the service
    this.canvasService.initializeCanvas(this.canvasRef, width, height);
    
    // Add event listener for window resize
    window.addEventListener('resize', this.handleResize);

    // Remove the cursor style that suggests dragging is available
    if (this.canvas) {
      this.canvas.style.cursor = 'default';
    }
  }

  private handleResize = (): void => {
    if (!this.isBrowser) return;
    
    this.resizeCanvas();
    this.redrawAllFractals();
  }

  private resizeCanvas(): void {
    if (!this.isBrowser || !this.canvas || !this.containerRef) return;
    
    const container = this.containerRef.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // Re-initialize the canvas with new dimensions
    this.canvasService.initializeCanvas(this.canvasRef, width, height);
    
    // Redraw all fractals after resize
    this.redrawAllFractals();
  }

  switchPanel(panel: string): void {
    this.activePanel = panel;
  }

  onDrawFractal(): void {
    // Cancel any existing editing before creating a new fractal
    if (this.editingFractalId) {
      const existingFractal = this.drawnFractals.find(f => f.id === this.editingFractalId);
      if (existingFractal?.isPlaceholder) {
        // Remove placeholder fractals if canceling
        this.drawnFractals = this.drawnFractals.filter(f => f.id !== this.editingFractalId);
      }
      this.editingFractalId = null;
    }

    // Create a new fractal based on selected type
    const fractalId = 'fractal_' + Date.now();
    const newFractal: Fractal = {
      id: fractalId,
      name: this.getFractalTypeName(this.selectedFractalType),
      type: this.selectedFractalType,
      color: this.getRandomColor(),
      parameters: this.getDefaultParameters(this.selectedFractalType),
      isPlaceholder: true
    };

    // Add to drawn fractals
    this.drawnFractals.unshift(newFractal);
    
    // Set as editing
    this.editingFractalId = fractalId;

    // Draw the fractal (only if in browser)
    if (this.isBrowser) {
      // Clear canvas and draw only this fractal
      this.canvasService.clearCanvas();
      this.drawFractal(newFractal);
    }
  }

  private getFractalTypeName(type: string): string {
    const found = this.fractalTypes.find(t => t.value === type);
    return found ? found.label : 'Невідомий фрактал';
  }

  private getRandomColor(): string {
    const colors = ['#FF5722', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  private getDefaultParameters(type: string): FractalParameter[] {
    switch (type) {
      case 'mandelbrot':
        return [
          { name: 'iterations', value: 100, min: 10, max: 1000, step: 10 },
          { name: 'zoom', value: 1, min: 0.1, max: 10, step: 0.1 },
          { name: 'centerX', value: -0.5, min: -2, max: 2, step: 0.01 },
          { name: 'centerY', value: 0, min: -2, max: 2, step: 0.01 }
        ];
      case 'julia':
        return [
          { name: 'iterations', value: 100, min: 10, max: 1000, step: 10 },
          { name: 'zoom', value: 1, min: 0.1, max: 10, step: 0.1 },
          { name: 'centerX', value: 0, min: -2, max: 2, step: 0.01 },
          { name: 'centerY', value: 0, min: -2, max: 2, step: 0.01 },
          { name: 'constantRe', value: -0.7, min: -2, max: 2, step: 0.01 },
          { name: 'constantIm', value: 0.27015, min: -2, max: 2, step: 0.01 }
        ];
      case 'sierpinski':
        return [
          { name: 'iterations', value: 6, min: 1, max: 10, step: 1 },
          { name: 'size', value: 0.9, min: 0.1, max: 1, step: 0.05 },
          { name: 'zoom', value: 1, min: 0.1, max: 5, step: 0.1 },
          { name: 'centerX', value: 0, min: -2, max: 2, step: 0.1 },
          { name: 'centerY', value: 0, min: -2, max: 2, step: 0.1 }
        ];
      case 'koch':
        return [
          { name: 'iterations', value: 4, min: 1, max: 6, step: 1 },
          { name: 'size', value: 0.8, min: 0.1, max: 1, step: 0.05 },
          { name: 'zoom', value: 1, min: 0.1, max: 5, step: 0.1 },
          { name: 'centerX', value: 0, min: -2, max: 2, step: 0.1 },
          { name: 'centerY', value: 0, min: -2, max: 2, step: 0.1 }
        ];
      case 'barnsley':
        return [
          { name: 'iterations', value: 50000, min: 1000, max: 100000, step: 1000 },
          { name: 'scale', value: 40, min: 10, max: 100, step: 5 },
          { name: 'zoom', value: 1, min: 0.1, max: 5, step: 0.1 },
          { name: 'centerX', value: 0, min: -2, max: 2, step: 0.1 },
          { name: 'centerY', value: 0, min: -2, max: 2, step: 0.1 }
        ];
      default:
        return [];
    }
  }

  drawFractal(fractal: Fractal): void {
    if (!this.isBrowser) return;
    
    // Clear the canvas using the service
    this.canvasService.clearCanvas();
    
    // Draw the fractal based on its type
    switch (fractal.type) {
      case 'mandelbrot':
        this.drawMandelbrot(fractal);
        break;
      case 'julia':
        this.drawJulia(fractal);
        break;
      case 'sierpinski':
        this.drawSierpinski(fractal);
        break;
      case 'koch':
        this.drawKoch(fractal);
        break;
      case 'barnsley':
        this.drawBarnsley(fractal);
        break;
    }
  }

  private drawMandelbrot(fractal: Fractal): void {
    if (!this.isBrowser || !this.canvas) return;

    const iterations = this.getParameterValue(fractal, 'iterations');
    const zoom = this.getParameterValue(fractal, 'zoom');
    const centerX = this.getParameterValue(fractal, 'centerX');
    const centerY = this.getParameterValue(fractal, 'centerY');
    
    // Get canvas size from service
    const canvasSize = this.canvasService.getCanvasSize();
    const width = canvasSize.width;
    const height = canvasSize.height;
    
    // Create offscreen canvas for better performance
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = width;
    offscreenCanvas.height = height;
    const offCtx = offscreenCanvas.getContext('2d');
    
    if (!offCtx) return;
    
    // Create an ImageData to manipulate pixels directly
    const imageData = offCtx.createImageData(width, height);
    const data = imageData.data;
    
    // Get color palette
    const colorPalette = this.generateColorPalette(iterations, fractal.color);
    
    // Calculate aspect ratio to maintain proper scaling
    const aspectRatio = width / height;
    const scale = 4.0 / (zoom * height); // Scale factor for converting pixel to complex coordinates
    
    // For each pixel in the canvas
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Map pixel coordinate to complex plane
        const real = centerX + (x - width / 2) * scale * aspectRatio;
        const imag = centerY + (y - height / 2) * scale;
        
        // Perform Mandelbrot iteration
        const iterCount = this.mandelbrotIteration(real, imag, iterations);
        
        // Color the pixel based on iteration count
        const pixelIndex = (y * width + x) * 4;
        
        if (iterCount === iterations) {
          // Points in the Mandelbrot set are black
          data[pixelIndex] = 0;
          data[pixelIndex + 1] = 0;
          data[pixelIndex + 2] = 0;
          data[pixelIndex + 3] = 255; // Alpha channel (fully opaque)
        } else {
          // Points outside the set get a color from our palette
          const color = colorPalette[Math.floor(iterCount) % colorPalette.length];
          data[pixelIndex] = color.r;
          data[pixelIndex + 1] = color.g;
          data[pixelIndex + 2] = color.b;
          data[pixelIndex + 3] = 255;
        }
      }
    }
    
    // Put the image data on the offscreen canvas
    offCtx.putImageData(imageData, 0, 0);
    
    // Now draw the offscreen canvas onto the main canvas
    const ctx = this.canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(offscreenCanvas, 0, 0);
      
      // Add text information about the fractal
      ctx.fillStyle = 'white';
      ctx.font = '14px Arial';
      ctx.fillText(`Множина Мандельброта (Ітерації: ${iterations}, Масштаб: ${zoom.toFixed(2)})`, 10, 30);
      ctx.fillText(`Центр: (${centerX.toFixed(4)}, ${centerY.toFixed(4)})`, 10, 50);
    }
  }

  /**
   * Calculates the Mandelbrot iteration count for a given complex number
   * @param real The real part of the complex number
   * @param imag The imaginary part of the complex number
   * @param maxIterations Maximum number of iterations to perform
   * @returns The number of iterations before the value escapes, or maxIterations if it doesn't escape
   */
  private mandelbrotIteration(real: number, imag: number, maxIterations: number): number {
    // Optimization: Early bailout for main cardioid and period-2 bulb
    const q = (real - 0.25) * (real - 0.25) + imag * imag;
    if (q * (q + (real - 0.25)) < 0.25 * imag * imag) {
      return maxIterations;
    }

    if ((real + 1) * (real + 1) + imag * imag < 0.0625) {
      return maxIterations;
    }

    // Variables for the Mandelbrot iteration
    let zr = 0;
    let zi = 0;
    let zr2 = 0;
    let zi2 = 0;
    let i = 0;

    // Main iteration loop
    while (i < maxIterations && zr2 + zi2 < 4) {
      zi = 2 * zr * zi + imag;
      zr = zr2 - zi2 + real;
      zr2 = zr * zr;
      zi2 = zi * zi;
      i++;
    }

    // Smooth coloring formula using logarithmic interpolation
    if (i < maxIterations) {
      // Apply smooth coloring by getting a decimal fraction based on how quickly the point escaped
      const log_zn = Math.log(zr2 + zi2) / 2;
      const nu = Math.log(log_zn / Math.log(2)) / Math.log(2);
      i = i + 1 - nu;
    }
    
    return i;
  }

  private drawJulia(fractal: Fractal): void {
    if (!this.isBrowser || !this.canvas) return;

    const iterations = this.getParameterValue(fractal, 'iterations');
    const zoom = this.getParameterValue(fractal, 'zoom');
    const centerX = this.getParameterValue(fractal, 'centerX');
    const centerY = this.getParameterValue(fractal, 'centerY');
    const constantRe = this.getParameterValue(fractal, 'constantRe');
    const constantIm = this.getParameterValue(fractal, 'constantIm');
    
    // Get canvas size from service
    const canvasSize = this.canvasService.getCanvasSize();
    const width = canvasSize.width;
    const height = canvasSize.height;
    
    // Create offscreen canvas for better performance
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = width;
    offscreenCanvas.height = height;
    const offCtx = offscreenCanvas.getContext('2d');
    
    if (!offCtx) return;
    
    // Create an ImageData to manipulate pixels directly
    const imageData = offCtx.createImageData(width, height);
    const data = imageData.data;
    
    // Get color palette - ensure it's not empty
    const colorPalette = this.generateColorPalette(iterations, fractal.color);
    if (colorPalette.length === 0) {
      console.error('Color palette is empty');
      return;
    }
    
    // Calculate aspect ratio to maintain proper scaling
    const aspectRatio = width / height;
    const scale = 4.0 / (zoom * height); // Scale factor for converting pixel to complex coordinates
    
    // For each pixel in the canvas
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Map pixel coordinate to complex plane
        const real = centerX + (x - width / 2) * scale * aspectRatio;
        const imag = centerY + (y - height / 2) * scale;
        
        // Perform Julia iteration with the constant
        const iterCount = this.juliaIteration(real, imag, constantRe, constantIm, iterations);
        
        // Color the pixel based on iteration count
        const pixelIndex = (y * width + x) * 4;
        
        if (iterCount === iterations) {
          // Points in the Julia set are black
          data[pixelIndex] = 0;
          data[pixelIndex + 1] = 0;
          data[pixelIndex + 2] = 0;
          data[pixelIndex + 3] = 255; // Alpha channel (fully opaque)
        } else {
          // Ensure we have a valid index and apply safe access to color palette
          const index = Math.min(Math.max(0, Math.floor(iterCount) % colorPalette.length), colorPalette.length - 1);
          const color = colorPalette[index];
          
          data[pixelIndex] = color.r;
          data[pixelIndex + 1] = color.g;
          data[pixelIndex + 2] = color.b;
          data[pixelIndex + 3] = 255;
        }
      }
    }
    
    // Put the image data on the offscreen canvas
    offCtx.putImageData(imageData, 0, 0);
    
    // Now draw the offscreen canvas onto the main canvas
    const ctx = this.canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(offscreenCanvas, 0, 0);
      
      // Add text information about the fractal
      ctx.fillStyle = 'white';
      ctx.font = '14px Arial';
      ctx.fillText(`Множина Жюліа (Ітерації: ${iterations}, Масштаб: ${zoom.toFixed(2)})`, 10, 30);
      ctx.fillText(`Центр: (${centerX.toFixed(4)}, ${centerY.toFixed(4)}), Константа: ${constantRe.toFixed(4)}+${constantIm.toFixed(4)}i`, 10, 50);
    }
  }

  /**
   * Calculates the Julia iteration count for a given complex number and constant
   * @param real The real part of the complex number (starting point)
   * @param imag The imaginary part of the complex number (starting point)
   * @param constRe The real part of the constant c
   * @param constIm The imaginary part of the constant c
   * @param maxIterations Maximum number of iterations to perform
   * @returns The number of iterations before the value escapes, or maxIterations if it doesn't escape
   */
  private juliaIteration(real: number, imag: number, constRe: number, constIm: number, maxIterations: number): number {
    // Handle invalid inputs
    if (isNaN(real) || isNaN(imag) || isNaN(constRe) || isNaN(constIm)) {
      return 0;
    }
    
    // For Julia set, we start with the given point z = real + imag*i
    let zr = real;
    let zi = imag;
    let zr2 = zr * zr;
    let zi2 = zi * zi;
    let i = 0;

    // Main iteration loop
    while (i < maxIterations && zr2 + zi2 < 4) {
      // z = z² + c, where c is the constant (constRe + constIm*i)
      zi = 2 * zr * zi + constIm;
      zr = zr2 - zi2 + constRe;
      zr2 = zr * zr;
      zi2 = zi * zi;
      i++;
      
      // Safety check for NaN values
      if (isNaN(zr2) || isNaN(zi2)) {
        return 0;
      }
    }

    // Smooth coloring formula using logarithmic interpolation
    if (i < maxIterations) {
      try {
        const log_zn = Math.log(zr2 + zi2) / 2;
        const nu = Math.log(log_zn / Math.log(2)) / Math.log(2);
        i = i + 1 - nu;
        
        // Ensure result is a valid number
        if (isNaN(i)) return 0;
      } catch (e) {
        // If any math errors occur, just return the raw iteration count
        return i;
      }
    }
    
    return i;
  }

  /**
   * Generates a color palette for the fractal rendering
   * @param iterations The maximum number of iterations
   * @param baseColor The base color to use for the palette
   * @returns An array of RGB color objects
   */
  private generateColorPalette(iterations: number, baseColor: string): { r: number, g: number, b: number }[] {
    const palette: { r: number, g: number, b: number }[] = [];
    
    try {
      // Convert hex color to RGB with validation
      if (!baseColor || !baseColor.startsWith('#') || baseColor.length < 7) {
        baseColor = '#FF5722'; // Default to orange if invalid
      }
      
      const r = parseInt(baseColor.substring(1, 3), 16);
      const g = parseInt(baseColor.substring(3, 5), 16);
      const b = parseInt(baseColor.substring(5, 7), 16);
      
      // Handle NaN values
      const validR = isNaN(r) ? 255 : r;
      const validG = isNaN(g) ? 87 : g;
      const validB = isNaN(b) ? 34 : b;
      
      // Create a smooth color palette
      const paletteSize = 256; // We'll use a fixed size palette and map iteration counts to it
      
      for (let i = 0; i < paletteSize; i++) {
        // Cycle through colors based on position in palette
        const t = i / paletteSize;
        
        // Use a combination of sine waves for a smooth gradient
        const r1 = Math.sin(t * Math.PI * 2) * 127 + 128;
        const g1 = Math.sin(t * Math.PI * 2 + 2 * Math.PI / 3) * 127 + 128;
        const b1 = Math.sin(t * Math.PI * 2 + 4 * Math.PI / 3) * 127 + 128;
        
        // Mix with the base color
        const newR = Math.floor((r1 + validR) / 2);
        const newG = Math.floor((g1 + validG) / 2);
        const newB = Math.floor((b1 + validB) / 2);
        
        palette.push({ r: newR, g: newG, b: newB });
      }
    } catch (e) {
      console.error('Error generating color palette:', e);
      // Add a default color to prevent empty palette
      palette.push({ r: 255, g: 87, b: 34 });
    }
    
    // Ensure we have at least one color
    if (palette.length === 0) {
      palette.push({ r: 255, g: 87, b: 34 });
    }
    
    return palette;
  }

  private drawSierpinski(fractal: Fractal): void {
    if (!this.isBrowser || !this.canvas) return;

    const iterations = this.getParameterValue(fractal, 'iterations');
    const size = this.getParameterValue(fractal, 'size');
    const zoom = this.getParameterValue(fractal, 'zoom');
    const centerX = this.getParameterValue(fractal, 'centerX');
    const centerY = this.getParameterValue(fractal, 'centerY');

    // Get canvas size from service
    const canvasSize = this.canvasService.getCanvasSize();
    const width = canvasSize.width;
    const height = canvasSize.height;
    
    // Get context directly from canvas element
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate the size of the main triangle based on canvas dimensions and zoom
    const baseSize = Math.min(height, width) * 0.8 * size;
    const triangleHeight = baseSize * zoom;
    const triangleWidth = triangleHeight * 1.1547; // width = height * 2/sqrt(3) for equilateral triangle
    
    // Apply centerX and centerY offsets
    const offsetX = width / 2 + centerX * 100; // Multiply by a factor to make the slider movement more noticeable
    const offsetY = height / 2 + centerY * 100;
    
    // Define the three points of the main triangle with offsets
    const p1 = { x: offsetX, y: offsetY - triangleHeight/2 }; // top
    const p2 = { x: offsetX - triangleWidth / 2, y: offsetY + triangleHeight/2 }; // bottom left
    const p3 = { x: offsetX + triangleWidth / 2, y: offsetY + triangleHeight/2 }; // bottom right
    
    // Set color and begin drawing
    ctx.fillStyle = fractal.color;
    ctx.strokeStyle = fractal.color;
    ctx.lineWidth = 1;
    
    // Start the recursive drawing
    this.drawSierpinskiTriangle(ctx, p1, p2, p3, iterations);
    
    // Display parameters text on canvas
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.fillText(`Трикутник Серпінського (Ітерації: ${iterations}, Розмір: ${size.toFixed(2)}, Масштаб: ${zoom.toFixed(2)})`, 10, 30);
    ctx.fillText(`Центр: (${centerX.toFixed(2)}, ${centerY.toFixed(2)})`, 10, 50);
  }
  
  /**
   * Draws a single triangle given three points
   */
  private drawTriangle(ctx: CanvasRenderingContext2D, p1: {x: number, y: number}, p2: {x: number, y: number}, p3: {x: number, y: number}): void {
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.closePath();
    ctx.fill();
  }
  
  /**
   * Recursively draws the Sierpinski triangle
   */
  private drawSierpinskiTriangle(
    ctx: CanvasRenderingContext2D, 
    p1: {x: number, y: number}, 
    p2: {x: number, y: number}, 
    p3: {x: number, y: number}, 
    depth: number
  ): void {
    // Base case: if we've reached the desired depth, draw a filled triangle
    if (depth === 0) {
      this.drawTriangle(ctx, p1, p2, p3);
      return;
    }
    
    // Calculate midpoints of each side
    const mid1 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }; // midpoint of p1 and p2
    const mid2 = { x: (p2.x + p3.x) / 2, y: (p2.y + p3.y) / 2 }; // midpoint of p2 and p3
    const mid3 = { x: (p3.x + p1.x) / 2, y: (p3.y + p1.y) / 2 }; // midpoint of p3 and p1
    
    // Recursively draw the three corner triangles
    this.drawSierpinskiTriangle(ctx, p1, mid1, mid3, depth - 1); // top triangle
    this.drawSierpinskiTriangle(ctx, mid1, p2, mid2, depth - 1); // bottom left triangle
    this.drawSierpinskiTriangle(ctx, mid3, mid2, p3, depth - 1); // bottom right triangle
  }

  private drawKoch(fractal: Fractal): void {
    if (!this.isBrowser || !this.canvas) return;

    const iterations = this.getParameterValue(fractal, 'iterations');
    const size = this.getParameterValue(fractal, 'size');
    const zoom = this.getParameterValue(fractal, 'zoom');
    const centerX = this.getParameterValue(fractal, 'centerX');
    const centerY = this.getParameterValue(fractal, 'centerY');

    // Get canvas size from service
    const canvasSize = this.canvasService.getCanvasSize();
    const width = canvasSize.width;
    const height = canvasSize.height;
    
    // Get context directly from canvas element
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set drawing properties
    ctx.strokeStyle = fractal.color;
    ctx.lineWidth = 1.5;
    
    // Calculate size of the snowflake based on canvas dimensions and size parameter
    const baseSize = Math.min(width, height) * 0.6 * size;
    const sideLength = baseSize * zoom;
    
    // Calculate the height of the equilateral triangle
    const triangleHeight = (Math.sqrt(3) / 2) * sideLength;
    
    // Apply centerX and centerY offsets
    const offsetX = width / 2 + centerX * 100; // Multiply by a factor to make slider movement more noticeable
    const offsetY = height / 2 + centerY * 100;
    
    // Calculate the three vertices of the initial triangle
    // Top vertex
    const x1 = offsetX;
    const y1 = offsetY - triangleHeight / 2;
    
    // Bottom left vertex
    const x2 = offsetX - sideLength / 2;
    const y2 = offsetY + triangleHeight / 2;
    
    // Bottom right vertex
    const x3 = offsetX + sideLength / 2;
    const y3 = offsetY + triangleHeight / 2;
    
    // Draw the Koch snowflake by drawing Koch curves for each side of the triangle
    ctx.beginPath();
    // First side (top to bottom left)
    this.drawKochCurve(ctx, x1, y1, x2, y2, iterations);
    // Second side (bottom left to bottom right)
    this.drawKochCurve(ctx, x2, y2, x3, y3, iterations);
    // Third side (bottom right to top)
    this.drawKochCurve(ctx, x3, y3, x1, y1, iterations);
    ctx.stroke();
    
    // Display parameters text on canvas
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.fillText(`Сніжинка Коха (Ітерації: ${iterations}, Розмір: ${size.toFixed(2)}, Масштаб: ${zoom.toFixed(2)})`, 10, 30);
    ctx.fillText(`Центр: (${centerX.toFixed(2)}, ${centerY.toFixed(2)})`, 10, 50);
}

/**
 * Recursively draws a Koch curve from (x1,y1) to (x2,y2) with given iterations
 */
private drawKochCurve(
  ctx: CanvasRenderingContext2D, 
  x1: number, 
  y1: number, 
  x2: number, 
  y2: number, 
  iterations: number
): void {
  if (iterations === 0) {
    // Base case: just draw a line
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    return;
  }
  
  // Calculate the length of the line segment
  const dx = x2 - x1;
  const dy = y2 - y1;
  
  // Calculate unit vector for the line
  const length = Math.sqrt(dx * dx + dy * dy);
  const unitX = dx / length;
  const unitY = dy / length;
  
  // Calculate the four points of the Koch curve
  // First point (start)
  const firstX = x1;
  const firstY = y1;
  
  // Second point (1/3 of the way)
  const secondX = x1 + dx / 3;
  const secondY = y1 + dy / 3;
  
  // Middle point (forms the peak of the equilateral triangle)
  // Rotate (dx/3, dy/3) by 60 degrees counter-clockwise
  const angle = Math.PI / 3; // 60 degrees in radians
  const middleX = secondX + length / 3 * (Math.cos(angle) * unitX - Math.sin(angle) * unitY);
  const middleY = secondY + length / 3 * (Math.sin(angle) * unitX + Math.cos(angle) * unitY);
  
  // Fourth point (2/3 of the way)
  const fourthX = x1 + 2 * dx / 3;
  const fourthY = y1 + 2 * dy / 3;
  
  // Fifth point (end)
  const fifthX = x2;
  const fifthY = y2;
  
  // Recursively draw the four segments
  this.drawKochCurve(ctx, firstX, firstY, secondX, secondY, iterations - 1);
  this.drawKochCurve(ctx, secondX, secondY, middleX, middleY, iterations - 1);
  this.drawKochCurve(ctx, middleX, middleY, fourthX, fourthY, iterations - 1);
  this.drawKochCurve(ctx, fourthX, fourthY, fifthX, fifthY, iterations - 1);
}

  private drawBarnsley(fractal: Fractal): void {
    if (!this.isBrowser || !this.canvas) return;

    const iterations = this.getParameterValue(fractal, 'iterations');
    const scale = this.getParameterValue(fractal, 'scale');
    const zoom = this.getParameterValue(fractal, 'zoom');
    const centerX = this.getParameterValue(fractal, 'centerX');
    const centerY = this.getParameterValue(fractal, 'centerY');

    // Get canvas size from service
    const canvasSize = this.canvasService.getCanvasSize();
    const width = canvasSize.width;
    const height = canvasSize.height;
    
    // Get context directly from canvas element
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set drawing properties
    ctx.fillStyle = fractal.color;
    
    // Barnsley fern transformation probabilities
    const probabilities = [0.01, 0.85, 0.07, 0.07];
    
    // Barnsley fern transformation coefficients
    // Each transformation is in the form:
    // [ a, b, c, d, e, f ]
    // where the transformation maps (x, y) to (ax + by + e, cx + dy + f)
    const transformations = [
      [0, 0, 0, 0.16, 0, 0],         // Stem
      [0.85, 0.04, -0.04, 0.85, 0, 1.6],  // Successively smaller leaflets
      [0.2, -0.26, 0.23, 0.22, 0, 1.6],   // Left-hand leaflets
      [-0.15, 0.28, 0.26, 0.24, 0, 0.44]  // Right-hand leaflets
    ];
    
    // Starting point
    let x = 0;
    let y = 0;
    
    // Apply scaling to make the fern fit nicely on the canvas
    const pointScale = scale * 0.05 * zoom; // Control the size of the fern, including zoom
    const offsetX = width / 2 + centerX * 100; // Center horizontally with offset
    const offsetY = height * 0.9 + centerY * 100; // Place near bottom of canvas with offset
    const inversionFactor = -1;     // Invert y coordinates for proper orientation
    
    // For each iteration, apply a randomly chosen transformation
    for (let i = 0; i < iterations; i++) {
      // Choose transformation based on probabilities
      const r = Math.random();
      let transformIndex = 0;
      let cumulativeProbability = 0;
      
      for (let j = 0; j < probabilities.length; j++) {
        cumulativeProbability += probabilities[j];
        if (r < cumulativeProbability) {
          transformIndex = j;
          break;
        }
      }
      
      // Apply the selected transformation
      const t = transformations[transformIndex];
      const nextX = t[0] * x + t[1] * y + t[4];
      const nextY = t[2] * x + t[3] * y + t[5];
      x = nextX;
      y = nextY;
      
      // Skip the first few iterations as they might not contribute to the pattern
      if (i < 20) continue;
      
      // Convert mathematical coordinates to canvas coordinates
      const canvasX = offsetX + x * pointScale * width / 20;
      const canvasY = offsetY + y * inversionFactor * pointScale * width / 20;
      
      // Draw a small point
      ctx.beginPath();
      ctx.arc(canvasX, canvasY, 0.5, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    // Display parameters text on canvas
    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.fillText(`Папороть Барнслі (Ітерації: ${iterations}, Масштаб: ${scale.toFixed(2)}, Zoom: ${zoom.toFixed(2)})`, 10, 30);
    ctx.fillText(`Центр: (${centerX.toFixed(2)}, ${centerY.toFixed(2)})`, 10, 50);
  }

  private getParameterValue(fractal: Fractal, paramName: string): number {
    const param = fractal.parameters.find(p => p.name === paramName);
    return param ? param.value : 0;
  }

  redrawAllFractals(): void {
    if (!this.isBrowser) return;
    
    // Only draw the current editing fractal if there is one
    if (this.editingFractalId) {
      const fractalToRedraw = this.drawnFractals.find(f => f.id === this.editingFractalId);
      if (fractalToRedraw) {
        this.canvasService.clearCanvas();
        this.drawFractal(fractalToRedraw);
        return;
      }
    }
    
    // If no fractal is being edited but there are fractals in the list, draw the first one
    if (this.drawnFractals.length > 0) {
      this.canvasService.clearCanvas();
      this.drawFractal(this.drawnFractals[0]);
    } else {
      // If no fractals, just clear the canvas
      this.canvasService.clearCanvas();
    }
  }

  onEditFractal(fractal: Fractal): void {
    // If already editing this fractal, toggle off
    if (this.editingFractalId === fractal.id) {
      this.editingFractalId = null;
      return;
    }
    
    // If editing another fractal, handle the state change
    if (this.editingFractalId) {
      const currentEditingFractal = this.drawnFractals.find(f => f.id === this.editingFractalId);
      if (currentEditingFractal?.isPlaceholder) {
        // Remove placeholder fractals if canceling
        this.drawnFractals = this.drawnFractals.filter(f => f.id !== this.editingFractalId);
      }
    }
    
    // Set the new fractal as editing
    this.editingFractalId = fractal.id;
    
    // Clear canvas and draw only this fractal
    if (this.isBrowser) {
      this.canvasService.clearCanvas();
      this.drawFractal(fractal);
    }
  }

  onDeleteFractal(fractalId: string): void {
    // Check if we're deleting the currently edited fractal
    const isDeletingCurrentlyEdited = this.editingFractalId === fractalId;
    
    // Remove from drawn fractals
    this.drawnFractals = this.drawnFractals.filter(f => f.id !== fractalId);
    
    // If deleting currently editing fractal, clear editing state
    if (isDeletingCurrentlyEdited) {
      this.editingFractalId = null;
    }

    // Redraw canvas with remaining fractals or clear it
    if (this.drawnFractals.length > 0) {
      // If we were editing and deleted that fractal, draw the first one
      // Otherwise keep the currently edited fractal
      if (isDeletingCurrentlyEdited) {
        this.canvasService.clearCanvas();
        this.drawFractal(this.drawnFractals[0]);
      } else if (this.editingFractalId) {
        // If another fractal is being edited, keep that one drawn
        const editingFractal = this.drawnFractals.find(f => f.id === this.editingFractalId);
        if (editingFractal) {
          this.canvasService.clearCanvas();
          this.drawFractal(editingFractal);
        }
      } else {
        // Otherwise draw the first fractal
        this.canvasService.clearCanvas();
        this.drawFractal(this.drawnFractals[0]);
      }
    } else {
      // If no fractals left, just clear the canvas
      this.canvasService.clearCanvas();
    }
  }

  updateFractalProperty(fractal: Fractal, paramName: string, value: any): void {
    // Find and update the parameter
    const param = fractal.parameters.find(p => p.name === paramName);
    if (param) {
      param.value = value;
      
      // Clear canvas and redraw only this fractal
      this.canvasService.clearCanvas();
      this.drawFractal(fractal);
    }
  }

  onSaveFractal(): void {
    const fractal = this.drawnFractals.find(f => f.id === this.editingFractalId);
    if (fractal) {
      // Remove placeholder status
      fractal.isPlaceholder = false;
      
      // Clear editing state
      this.editingFractalId = null;
      
      // Keep this fractal drawn on the canvas
      this.canvasService.clearCanvas();
      this.drawFractal(fractal);
    }
  }

  onCancelEditFractal(): void {
    // Store the current fractal ID before removing it
    const currentId = this.editingFractalId;
    
    // Remove placeholder fractals if canceling
    this.drawnFractals = this.drawnFractals.filter(f => !f.isPlaceholder);
    
    // Clear editing state
    this.editingFractalId = null;
    
    // Redraw the most recent non-placeholder fractal or clear canvas
    if (this.drawnFractals.length > 0) {
      const lastFractal = this.drawnFractals[0];
      this.canvasService.clearCanvas();
      this.drawFractal(lastFractal);
    } else {
      // If no fractals left, just clear the canvas
      this.canvasService.clearCanvas();
    }
  }

  getParameterDisplayName(paramName: string): string {
    const displayNames: { [key: string]: string } = {
      'iterations': 'Ітерації',
      'zoom': 'Масштаб',
      'centerX': 'Центр X',
      'centerY': 'Центр Y',
      'constantRe': 'Константа (Re)',
      'constantIm': 'Константа (Im)',
      'size': 'Розмір',
      'scale': 'Масштаб'
    };
    
    return displayNames[paramName] || paramName;
  }

  /**
   * Handles file selection for loading fractals
   */
  onFileSelected(event: Event): void {
    if (!this.isBrowser) return;
    
    const input = event.target as HTMLInputElement;
    
    if (!input.files || input.files.length === 0) {
      return;
    }
    
    const file = input.files[0];
    const reader = new FileReader();
    
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const fileContent = e.target?.result as string;
        const fractalData = JSON.parse(fileContent);
        
        // Validate the imported data
        if (!this.isValidFractalData(fractalData)) {
          alert('Невірний формат файлу фрактала.');
          return;
        }
        
        // Generate a new ID to avoid conflicts
        const fractalId = 'fractal_' + Date.now();
        const importedFractal: Fractal = {
          ...fractalData,
          id: fractalId
        };
        
        // Add to drawn fractals
        this.drawnFractals.unshift(importedFractal);
        
        // Set as editing
        this.editingFractalId = fractalId;
        
        // Draw the fractal
        this.drawFractal(importedFractal);
        
        // Reset the file input
        input.value = '';
        
      } catch (error) {
        console.error('Error loading fractal:', error);
        alert('Помилка при завантаженні фрактала. Перевірте формат файлу.');
      }
    };
    
    reader.readAsText(file);
  }
  
  /**
   * Validates imported fractal data
   */
  private isValidFractalData(data: any): boolean {
    // Basic validation
    if (!data || typeof data !== 'object') return false;
    
    // Required fields
    const requiredFields = ['name', 'type', 'color', 'parameters'];
    for (const field of requiredFields) {
      if (!data[field]) return false;
    }
    
    // Validate parameters
    if (!Array.isArray(data.parameters)) return false;
    
    // Check if fractal type is valid
    const validTypes = this.fractalTypes.map(t => t.value);
    if (!validTypes.includes(data.type)) return false;
    
    return true;
  }

  /**
   * Downloads the current fractal as an image
   */
  downloadFractal(): void {
    if (!this.isBrowser || !this.canvas) return;
    
    try {
      // Find the active fractal
      const activeFractal = this.drawnFractals.find(f => f.id === this.editingFractalId) 
                            || (this.drawnFractals.length > 0 ? this.drawnFractals[0] : null);
      
      if (!activeFractal) {
        alert('Немає фрактала для завантаження. Спочатку згенеруйте фрактал.');
        return;
      }
      
      // Generate filename based on fractal name and current date
      const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
      const fileName = `${activeFractal.name.replace(/\s+/g, '_')}_${timestamp}`;
      
      // Create downloadable image
      const dataUrl = this.canvas.toDataURL('image/png');
      
      // Create download link
      const link = document.createElement('a');
      link.download = `${fileName}.png`;
      link.href = dataUrl;
      link.click();
      
      // Optional: Also offer to download the fractal settings as JSON
      if (confirm('Бажаєте також зберегти налаштування фрактала як JSON файл?')) {
        this.downloadFractalSettings(activeFractal, fileName);
      }
      
    } catch (error) {
      console.error('Error downloading fractal:', error);
      alert('Помилка при завантаженні фрактала.');
    }
  }
  
  /**
   * Downloads fractal settings as a JSON file
   */
  private downloadFractalSettings(fractal: Fractal, fileName: string): void {
    // Prepare fractal data for export (exclude internal properties)
    const exportData = {
      name: fractal.name,
      type: fractal.type,
      color: fractal.color,
      parameters: fractal.parameters
    };
    
    // Convert to JSON string
    const jsonString = JSON.stringify(exportData, null, 2);
    
    // Create a Blob with the JSON data
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // Create download link
    const link = document.createElement('a');
    link.download = `${fileName}.json`;
    link.href = URL.createObjectURL(blob);
    link.click();
    
    // Clean up
    URL.revokeObjectURL(link.href);
  }

  // Task-related methods
  fetchCardDetails(cardId: number): void {
    if (!this.isBrowser) return;
    
    this.lessonsService.getCardById(cardId).subscribe({
      next: (cardData) => { 
        if (cardData) {
          console.log('Card details received in SandboxCardFractalComponent:', cardData);
          this.card = cardData;
          
          if (cardData.lessonId) {
            localStorage.setItem('selectedLessonId', cardData.lessonId.toString());
          }
          
          setTimeout(() => this.setupCanvas(), 100);
        } else {
          console.error(`SandboxCardFractalComponent: Failed to fetch card details for ID ${cardId} from service.`);
        }
      },
      error: (err) => {
        console.error(`SandboxCardFractalComponent: Error fetching card details for ID ${cardId}:`, err);
      }
    });
  }

  selectTask(task: Task): void {
    this.selectedTask = task;
    if(task.expectedDataCount && task.expectedDataType){
      this.taskAnswers = new Array(task.expectedDataCount).fill(undefined);
    } else {
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
      if (this.isBrowser) {
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
          const entry: any = {};

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

  @HostListener('window:load')
  onPageLoad(): void {
    if (this.isBrowser) {
      // Check if this is a page refresh
      const isPageRefresh = this.isPageRefresh();
      
      if (isPageRefresh) {
        const cardId = localStorage.getItem('selectedCardId');
        if (cardId) {
          console.log('Page was refreshed - forcing fractal sandbox card data update from server');
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
    console.log(`SandboxCardFractalComponent: Forcing refresh for card ${cardId} from server`);
    
    this.lessonsService.forceRefreshCardById(cardId).subscribe({
      next: (cardData) => {
        if (cardData) {
          console.log('Card details refreshed from server in SandboxCardFractalComponent:', cardData);
          this.card = cardData;
          
          if (cardData.lessonId) {
            localStorage.setItem('selectedLessonId', cardData.lessonId.toString());
          }
          
          setTimeout(() => this.setupCanvas(), 100);
        } else {
          console.error(`SandboxCardFractalComponent: Failed to fetch fresh card details for ID ${cardId} from service.`);
        }
      },
      error: (err) => {
        console.error(`SandboxCardFractalComponent: Error refreshing card details for ID ${cardId}:`, err);
        
        // Try to load from cache as fallback
        const cachedCardId = localStorage.getItem('selectedCardId');
        if (cachedCardId) {
          this.fetchCardDetails(parseInt(cachedCardId, 10));
        }
      }
    });
  }
}
