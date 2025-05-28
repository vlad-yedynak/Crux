import { Component, ElementRef, ViewChild, AfterViewInit, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { LessonsService, Card, Task } from '../../services/lessons.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthServiceService } from '../../services/auth-service.service';
import { ConfigService } from '../../services/config.service';

// Інтерфейси для колірних систем
interface RGB { r: number; g: number; b: number; }
interface HSL { h: number; s: number; l: number; }
interface HSV { h: number; s: number; v: number; }
interface CMYK { c: number; m: number; y: number; k: number; }
interface LAB { l: number; a: number; b_val: number; }
interface XYZ { x: number; y_val: number; z_val: number; }

@Component({
  selector: 'app-sandbox-card-colors',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sandbox-card-colors.component.html',
  styleUrl: './sandbox-card-colors.component.css'
})
export class SandboxCardColorsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('originalCanvas') originalCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('modifiedCanvas') modifiedCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('colorPreview') colorPreviewRef!: ElementRef<HTMLDivElement>;

  private originalCtx!: CanvasRenderingContext2D | null;
  private modifiedCtx!: CanvasRenderingContext2D | null;
  private originalImage: HTMLImageElement | null = null;
  public currentImageData: ImageData | null = null;

  // Tab navigation
  activePanel: 'colors' | 'tasks' = 'colors';
  
  // Task-related properties
  card: Card | null = null;
  cardId: string | null = null;
  selectedTask: Task | null = null;
  taskAnswers: any[] = [];
  showResultsPopup = false;
  taskResultCorrect = false;
  resultFeedback = '';
  showAuthMessage = false;

  activeColorSystem: string = 'RGB';
  colorSystems: string[] = ['RGB', 'HSL', 'HSV', 'CMYK', 'LAB', 'XYZ'];

  rgbValues: RGB = { r: 128, g: 128, b: 128 };
  hslValues: HSL = { h: 0, s: 50, l: 50 };
  hsvValues: HSV = { h: 0, s: 50, v: 50 };
  cmykValues: CMYK = { c: 0, m: 0, y: 0, k: 50 };
  labValues: LAB = { l: 53.59, a: 0, b_val: 0 };
  xyzValues: XYZ = { x: 20.52, y_val: 21.59, z_val: 23.52 };

  private defaultRgbValues: RGB = { r: 128, g: 128, b: 128 };
  private defaultHslValues: HSL = { h: 0, s: 50, l: 50 };
  private defaultHsvValues: HSV = { h: 0, s: 50, v: 50 };
  private defaultCmykValues: CMYK = { c: 0, m: 0, y: 0, k: 50 };
  private defaultLabValues: LAB = { l: 53.59, a: 0, b_val: 0 };
  private defaultXyzValues: XYZ = { x: 20.52, y_val: 21.59, z_val: 23.52 };

  isSelectingRegion = false;
  selectionRect = {startX: 0, startY: 0, endX: 0, endY: 0, drawing: false};
  colorPreview: string = "rgb(128, 128, 128)";
  
  // Ім'я файлу для завантаження зображення
  private fileName: string = "image-edited.png";

  constructor(
    private route: ActivatedRoute,
    private lessonsService: LessonsService,
    private http: HttpClient,
    private authService: AuthServiceService,
    private configService: ConfigService
  ) {
    this.resetColorValuesToDefaults();
  }

  ngOnInit(): void {
    // Check authentication state
    if (this.authService.isLoggedIn()) {
      // First try to get card ID from localStorage (when navigating from lessons page)
      const storedCardId = localStorage.getItem('selectedCardId');
      if (storedCardId) {
        console.log('Loading card from localStorage with ID:', storedCardId);
        this.cardId = storedCardId;
        this.loadCardDetails(parseInt(storedCardId, 10));
      } else {
        // If not in localStorage, try from route params
        this.route.paramMap.subscribe(params => {
          const cardIdParam = params.get('id');
          if (cardIdParam) {
            this.cardId = cardIdParam;
            this.loadCardDetails(parseInt(cardIdParam, 10));
          } else {
            // No card ID found, show interface without card data
            console.log('No card ID found in params or localStorage');
            this.showAuthMessage = false;
          }
        });
      }
    } else {
      this.showAuthMessage = true;
    }
  }

  loadCardDetails(cardId: number): void {
    this.lessonsService.getCardById(cardId).subscribe(
      (card: Card | null) => {
        if (card) {
          console.log('Card details received in SandboxCardColorsComponent:', card);
          this.card = card;
          
          // Set active panel to 'colors' by default
          this.activePanel = 'colors';
          
          // Store lesson ID if available
          if (card.lessonId) {
            localStorage.setItem('selectedLessonId', card.lessonId.toString());
          }
          
          // Initialize canvas with default state
          setTimeout(() => {
            this.setDefaultCanvasAppearance();
          }, 100);
        } else {
          console.error(`SandboxCardColorsComponent: Failed to fetch card details for ID ${cardId} from service.`);
        }
      },
      (err: any) => {
        console.error('Error loading card details:', err);
      }
    );
  }

  ngOnDestroy(): void {
    // Clean up resources if needed
    if (this.originalImage) {
      this.originalImage.onload = null;
    }
    
    // Save progress to local storage if needed
    localStorage.removeItem('selectedCardId');
  }

  ngAfterViewInit(): void {
    if (this.originalCanvasRef && this.originalCanvasRef.nativeElement) {
      this.originalCtx = this.originalCanvasRef.nativeElement.getContext('2d');
    }
    if (this.modifiedCanvasRef && this.modifiedCanvasRef.nativeElement) {
      this.modifiedCtx = this.modifiedCanvasRef.nativeElement.getContext('2d');
    }
    this.setDefaultCanvasAppearance();
    this.updateColorPreview();
  }

  private resetColorValuesToDefaults(): void {
    this.rgbValues = { ...this.defaultRgbValues };
    this.hslValues = { ...this.defaultHslValues };
    this.hsvValues = { ...this.defaultHsvValues };
    this.cmykValues = { ...this.defaultCmykValues };
    this.labValues = { ...this.defaultLabValues };
    this.xyzValues = { ...this.defaultXyzValues };
  }

  private setDefaultCanvasAppearance(): void {
    const canvases = [this.originalCanvasRef, this.modifiedCanvasRef];
    canvases.forEach(canvasRef => {
      if (canvasRef && canvasRef.nativeElement) {
        const canvas = canvasRef.nativeElement;
        canvas.width = 600;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#444';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.font = '16px Arial';
          ctx.fillStyle = 'white';
          ctx.textAlign = 'center';
          ctx.fillText('Завантажте зображення для редагування', canvas.width / 2, canvas.height / 2);
        }
      }
    });
  }

  handleImageUpload(event: any): void {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      // Set the filename for download based on the original file name
      const originalFileName = file.name;
      const fileNameParts = originalFileName.split('.');
      const extension = fileNameParts.length > 1 ? fileNameParts.pop() : 'png';
      const baseName = fileNameParts.join('.');
      this.fileName = `${baseName}-edited.${extension}`;
      
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.originalImage = new Image();
        this.originalImage.onload = () => {
          if (this.originalCanvasRef && this.originalCanvasRef.nativeElement && this.modifiedCanvasRef && this.modifiedCanvasRef.nativeElement && this.originalCtx && this.modifiedCtx) {
            // Встановлюємо розмір канвасів відповідно до зображення
            const canvas = this.originalCanvasRef.nativeElement;
            const modCanvas = this.modifiedCanvasRef.nativeElement;
            
            // Зберігаємо співвідношення сторін
            const maxWidth = 600;
            const maxHeight = 400;
            let width = this.originalImage!.width;
            let height = this.originalImage!.height;
            
            if (width > maxWidth || height > maxHeight) {
              const ratio = Math.min(maxWidth / width, maxHeight / height);
              width *= ratio;
              height *= ratio;
            }
            
            canvas.width = modCanvas.width = width;
            canvas.height = modCanvas.height = height;
            
            // Малюємо оригінальне зображення
            this.originalCtx.drawImage(this.originalImage!, 0, 0, width, height);
            
            // Зберігаємо дані зображення для маніпуляцій
            this.currentImageData = this.originalCtx.getImageData(0, 0, width, height);
            
            // Малюємо модифіковане зображення (спочатку таке ж як оригінал)
            this.modifiedCtx.putImageData(this.currentImageData, 0, 0);
          }
        };
        this.originalImage.src = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      console.warn('Файл не вибрано або тип файлу не підтримується.');
      this.originalImage = null;
      this.currentImageData = null;
      this.setDefaultCanvasAppearance();
      this.resetColorValuesToDefaults();
    }
  }

  resetColorValuesToNeutralForImage(): void {
    this.rgbValues = { ...this.defaultRgbValues };
    this.hslValues = { ...this.defaultHslValues };
    this.hsvValues = { ...this.defaultHsvValues };
    this.cmykValues = { ...this.defaultCmykValues };
    this.labValues = { ...this.defaultLabValues };
    this.xyzValues = { ...this.defaultXyzValues };
    this.convertRGBToActiveSystem();
  }

  resetColorValues(): void {
    if (this.originalImage && this.currentImageData) {
        this.resetColorValuesToNeutralForImage();
        this.applyColorManipulation();
    } else {
        this.resetColorValuesToDefaults();
        this.setDefaultCanvasAppearance();
    }
    this.updateColorPreview();
  }

  onColorInputChange(): void {
    if (!this.currentImageData && !this.originalImage) {
        console.log("Колір змінено, але зображення не завантажено.");
    } else {
        // Конвертуємо поточну систему в RGB і оновлюємо превью
        this.convertCurrentSystemToRGB();
        this.updateColorPreview();
        
        // Застосовуємо зміни залежно від того, чи є активна область
        const selection = this.getNormalizedSelectionRect();
        if (this.isSelectingRegion && (selection.width > 0 || selection.height > 0)) {
            // Якщо є активна область, застосовуємо зміни тільки до неї
            this.applyColorManipulationToRegion();
        } else {
            // Інакше застосовуємо до всього зображення
            this.applyColorManipulation();
        }
    }
  }

  updateColorPreview(): void {
    // Використовуємо конкретні RGB значення, а не рядок для colorPreview
    this.colorPreview = `rgb(${this.rgbValues.r}, ${this.rgbValues.g}, ${this.rgbValues.b})`;
    
    // Оновлюємо CSS змінні для градієнтів
    document.documentElement.style.setProperty('--r', this.rgbValues.r.toString());
    document.documentElement.style.setProperty('--g', this.rgbValues.g.toString());
    document.documentElement.style.setProperty('--b', this.rgbValues.b.toString());
    document.documentElement.style.setProperty('--h', this.hslValues.h.toString());
    document.documentElement.style.setProperty('--s', this.hslValues.s.toString());
    document.documentElement.style.setProperty('--l', this.hslValues.l.toString());
    document.documentElement.style.setProperty('--sv', this.hsvValues.s.toString()); // Додаємо HSV змінні
    document.documentElement.style.setProperty('--v', this.hsvValues.v.toString());
    document.documentElement.style.setProperty('--c', this.cmykValues.c.toString());
    document.documentElement.style.setProperty('--m', this.cmykValues.m.toString());
    document.documentElement.style.setProperty('--y', this.cmykValues.y.toString());
    document.documentElement.style.setProperty('--k', this.cmykValues.k.toString());
    
    // Оновлюємо DOM елемент безпосередньо, якщо він існує
    if (this.colorPreviewRef && this.colorPreviewRef.nativeElement) {
      this.colorPreviewRef.nativeElement.style.backgroundColor = this.colorPreview;
    }
  }

  switchColorSystem(system: string): void {
    this.activeColorSystem = system;
    this.convertRGBToActiveSystem();
  }

  // Конвертація поточної системи кольорів до RGB
  convertCurrentSystemToRGB(): void {
    console.log(`Конвертація ${this.activeColorSystem} до RGB`);
    switch (this.activeColorSystem) {
      case 'HSL':
        const rgb = this.hslToRgb(this.hslValues.h, this.hslValues.s, this.hslValues.l);
        this.rgbValues = rgb;
        break;
      case 'HSV':
        const rgbFromHsv = this.hsvToRgb(this.hsvValues.h, this.hsvValues.s, this.hsvValues.v);
        this.rgbValues = rgbFromHsv;
        break;
      case 'CMYK':
        const rgbFromCmyk = this.cmykToRgb(this.cmykValues.c, this.cmykValues.m, this.cmykValues.y, this.cmykValues.k);
        this.rgbValues = rgbFromCmyk;
        break;
      case 'LAB':
        const rgbFromLab = this.labToRgb(this.labValues.l, this.labValues.a, this.labValues.b_val);
        this.rgbValues = rgbFromLab;
        break;
      case 'XYZ':
        const rgbFromXyz = this.xyzToRgb(this.xyzValues.x, this.xyzValues.y_val, this.xyzValues.z_val);
        this.rgbValues = rgbFromXyz;
        break;
      case 'RGB':
      default:
        // Нічого не робити, rgbValues вже встановлено
        break;
    }
    
    // Оновлюємо всі інші системи кольорів
    this.updateAllColorSystems();
    
    // Обмежуємо значення RGB у межах 0-255
    this.rgbValues.r = Math.max(0, Math.min(255, Math.round(this.rgbValues.r)));
    this.rgbValues.g = Math.max(0, Math.min(255, Math.round(this.rgbValues.g)));
    this.rgbValues.b = Math.max(0, Math.min(255, Math.round(this.rgbValues.b)));
  }

  // Оновлення всіх колірних систем на основі RGB
  private updateAllColorSystems(): void {
    if (this.activeColorSystem !== 'HSL') {
      this.hslValues = this.rgbToHsl(this.rgbValues.r, this.rgbValues.g, this.rgbValues.b);
    }
    if (this.activeColorSystem !== 'HSV') {
      this.hsvValues = this.rgbToHsv(this.rgbValues.r, this.rgbValues.g, this.rgbValues.b);
    }
    if (this.activeColorSystem !== 'CMYK') {
      this.cmykValues = this.rgbToCmyk(this.rgbValues.r, this.rgbValues.g, this.rgbValues.b);
    }
    if (this.activeColorSystem !== 'LAB') {
      this.labValues = this.rgbToLab(this.rgbValues.r, this.rgbValues.g, this.rgbValues.b);
    }
    if (this.activeColorSystem !== 'XYZ') {
      this.xyzValues = this.rgbToXyz(this.rgbValues.r, this.rgbValues.g, this.rgbValues.b);
    }
  }

  // Конвертація з RGB до активної системи кольорів
  convertRGBToActiveSystem(): void {
    console.log(`Конвертація RGB до ${this.activeColorSystem}`);
    const { r, g, b } = this.rgbValues;
    
    switch (this.activeColorSystem) {
      case 'HSL':
        this.hslValues = this.rgbToHsl(r, g, b);
        break;
      case 'HSV':
        this.hsvValues = this.rgbToHsv(r, g, b);
        break;
      case 'CMYK':
        this.cmykValues = this.rgbToCmyk(r, g, b);
        break;
      case 'LAB':
        this.labValues = this.rgbToLab(r, g, b);
        break;
      case 'XYZ':
        this.xyzValues = this.rgbToXyz(r, g, b);
        break;
      case 'RGB':
      default:
        // Нічого не робити, rgbValues вже встановлено
        break;
    }
    
    this.updateColorPreview();
  }

  // Конвертація з RGB до HEX
  rgbToHex(r: number, g: number, b: number): string {
    return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  // Конвертація з RGB до HSL
  rgbToHsl(r: number, g: number, b: number): HSL {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      
      h /= 6;
    }
    
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  }

  // Конвертація з HSL до RGB
  hslToRgb(h: number, s: number, l: number): RGB {
    h /= 360;
    s /= 100;
    l /= 100;
    
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    return { 
      r: Math.round(r * 255), 
      g: Math.round(g * 255), 
      b: Math.round(b * 255) 
    };
  }

  // Конвертація з RGB до HSV
  rgbToHsv(r: number, g: number, b: number): HSV {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    const v = max;
    const d = max - min;
    const s = max === 0 ? 0 : d / max;
    
    if (max !== min) {
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      
      h /= 6;
    }
    
    return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
  }

  // Конвертація з HSV до RGB
  hsvToRgb(h: number, s: number, v: number): RGB {
    h /= 360;
    s /= 100;
    v /= 100;
    
    let r = 0, g = 0, b = 0;
    
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    
    switch (i % 6) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      case 5: r = v; g = p; b = q; break;
    }
    
    return { 
      r: Math.round(r * 255), 
      g: Math.round(g * 255), 
      b: Math.round(b * 255) 
    };
  }

  // Конвертація з RGB до CMYK
  rgbToCmyk(r: number, g: number, b: number): CMYK {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const k = 1 - Math.max(r, g, b);
    const c = (1 - r - k) / (1 - k) || 0;
    const m = (1 - g - k) / (1 - k) || 0;
    const y = (1 - b - k) / (1 - k) || 0;
    
    return { 
      c: Math.round(c * 100), 
      m: Math.round(m * 100), 
      y: Math.round(y * 100), 
      k: Math.round(k * 100) 
    };
  }

  // Конвертація з CMYK до RGB
  cmykToRgb(c: number, m: number, y: number, k: number): RGB {
    c /= 100;
    m /= 100;
    y /= 100;
    k /= 100;
    
    const r = 255 * (1 - c) * (1 - k);
    const g = 255 * (1 - m) * (1 - k);
    const b = 255 * (1 - y) * (1 - k);
    
    return { 
      r: Math.round(r), 
      g: Math.round(g), 
      b: Math.round(b) 
    };
  }

  // Конвертація з RGB до XYZ
  rgbToXyz(r: number, g: number, b: number): XYZ {
    r /= 255;
    g /= 255;
    b /= 255;
    
    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
    
    r *= 100;
    g *= 100;
    b *= 100;
    
    const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
    const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
    const z = r * 0.0193 + g * 0.1192 + b * 0.9505;
    
    return { 
      x: parseFloat(x.toFixed(2)), 
      y_val: parseFloat(y.toFixed(2)), 
      z_val: parseFloat(z.toFixed(2)) 
    };
  }

  // Конвертація з XYZ до RGB
  xyzToRgb(x: number, y: number, z: number): RGB {
    x /= 100;
    y /= 100;
    z /= 100;
    
    let r = x * 3.2406 + y * -1.5372 + z * -0.4986;
    let g = x * -0.9689 + y * 1.8758 + z * 0.0415;
    let b = x * 0.0557 + y * -0.2040 + z * 1.0570;
    
    r = r > 0.0031308 ? 1.055 * Math.pow(r, 1/2.4) - 0.055 : 12.92 * r;
    g = g > 0.0031308 ? 1.055 * Math.pow(g, 1/2.4) - 0.055 : 12.92 * g;
    b = b > 0.0031308 ? 1.055 * Math.pow(b, 1/2.4) - 0.055 : 12.92 * b;
    
    return { 
      r: Math.max(0, Math.min(255, Math.round(r * 255))), 
      g: Math.max(0, Math.min(255, Math.round(g * 255))), 
      b: Math.max(0, Math.min(255, Math.round(b * 255))) 
    };
  }

  // Конвертація з XYZ до LAB
  xyzToLab(x: number, y: number, z: number): LAB {
    // Еталонні значення для D65
    const xRef = 95.047;
    const yRef = 100.0;
    const zRef = 108.883;
    
    x /= xRef;
    y /= yRef;
    z /= zRef;
    
    x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x) + (16 / 116);
    y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y) + (16 / 116);
    z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z) + (16 / 116);
    
    const l = (116 * y) - 16;
    const a = 500 * (x - y);
    const b = 200 * (y - z);
    
    return { 
      l: parseFloat(l.toFixed(2)), 
      a: parseFloat(a.toFixed(2)), 
      b_val: parseFloat(b.toFixed(2)) 
    };
  }

  // Конвертація з LAB до XYZ
  labToXyz(l: number, a: number, b: number): XYZ {
    let y = (l + 16) / 116;
    let x = a / 500 + y;
    let z = y - b / 200;
    
    const y3 = Math.pow(y, 3);
    const x3 = Math.pow(x, 3);
    const z3 = Math.pow(z, 3);
    
    y = y3 > 0.008856 ? y3 : (y - 16 / 116) / 7.787;
    x = x3 > 0.008856 ? x3 : (x - 16 / 116) / 7.787;
    z = z3 > 0.008856 ? z3 : (z - 16 / 116) / 7.787;
    
    // Еталонні значення для D65
    const xRef = 95.047;
    const yRef = 100.0;
    const zRef = 108.883;
    
    return { 
      x: parseFloat((x * xRef).toFixed(2)), 
      y_val: parseFloat((y * yRef).toFixed(2)), 
      z_val: parseFloat((z * zRef).toFixed(2)) 
    };
  }

  // Конвертація з RGB до LAB
  rgbToLab(r: number, g: number, b: number): LAB {
    const xyz = this.rgbToXyz(r, g, b);
    return this.xyzToLab(xyz.x, xyz.y_val, xyz.z_val);
  }

  // Конвертація з LAB до RGB
  labToRgb(l: number, a: number, b_val: number): RGB {
    const xyz = this.labToXyz(l, a, b_val);
    return this.xyzToRgb(xyz.x, xyz.y_val, xyz.z_val);
  }

  // --- Методи обробки зображення ---

  applyColorManipulation(): void {
    if (!this.modifiedCtx || !this.currentImageData || !this.originalImage) return;

    // Створюємо новий ImageData з оригінальних пікселів, щоб уникнути накопичення змін
    const newImageData = new ImageData(
      new Uint8ClampedArray(this.currentImageData.data), 
      this.currentImageData.width,
      this.currentImageData.height
    );
    const data = newImageData.data;
    
    // Використовуємо поточні RGB значення для маніпуляції
    const { r: r_adj, g: g_adj, b: b_adj } = this.rgbValues;
    
    // Фактори для маніпуляції кольором
    const rFactor = r_adj / 128.0;
    const gFactor = g_adj / 128.0;
    const bFactor = b_adj / 128.0;

    for (let i = 0; i < data.length; i += 4) {
      // Застосовуємо множник до кожного кольорового каналу
      data[i] = Math.min(255, Math.max(0, data[i] * rFactor));
      data[i+1] = Math.min(255, Math.max(0, data[i+1] * gFactor));
      data[i+2] = Math.min(255, Math.max(0, data[i+2] * bFactor));
    }
    
    this.modifiedCtx.putImageData(newImageData, 0, 0);
    
    // Якщо є активне виділення і режим виділення увімкнено, відображаємо його знову
    if (this.isSelectingRegion) {
      const selection = this.getNormalizedSelectionRect();
      if (selection.width > 0 && selection.height > 0) {
        const tempCtx = this.modifiedCanvasRef.nativeElement.getContext('2d');
        if (tempCtx) {
          // Малюємо рамку виділення
          tempCtx.strokeStyle = 'rgba(220, 50, 50, 0.7)';
          tempCtx.lineWidth = 1.5;
          tempCtx.strokeRect(
            selection.x,
            selection.y,
            selection.width,
            selection.height
          );
          
          // Додаємо напівпрозорий фон для виділеної області
          tempCtx.fillStyle = 'rgba(220, 50, 50, 0.1)';
          tempCtx.fillRect(
            selection.x,
            selection.y,
            selection.width,
            selection.height
          );
        }
      }
    }
  }

  // --- Методи вибору регіону ---

  startSelection(event: MouseEvent): void {
    if (!this.modifiedCtx || !this.originalImage || !this.currentImageData) return;
    
    this.isSelectingRegion = true;
    this.selectionRect.drawing = true;
    
    const rect = this.modifiedCanvasRef.nativeElement.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;
    
    // Переводимо координати курсора в координати канвасу
    // з урахуванням можливого масштабування
    const scaleX = this.modifiedCanvasRef.nativeElement.width / rect.width;
    const scaleY = this.modifiedCanvasRef.nativeElement.height / rect.height;
    
    this.selectionRect.startX = canvasX * scaleX;
    this.selectionRect.startY = canvasY * scaleY;
    this.selectionRect.endX = this.selectionRect.startX;
    this.selectionRect.endY = this.selectionRect.startY;
    
    // Відображаємо початкове виділення точкою
    this.drawInitialSelection();
  }
  
  // Метод для відображення початкової точки виділення
  drawInitialSelection(): void {
    if (!this.modifiedCtx || !this.currentImageData) return;
    
    // Перемальовуємо зображення
    this.applyColorManipulation();
    
    // Малюємо початкову точку виділення
    const tempCtx = this.modifiedCanvasRef.nativeElement.getContext('2d');
    if (tempCtx) {
      tempCtx.fillStyle = 'rgba(220, 50, 50, 0.7)';
      tempCtx.beginPath();
      tempCtx.arc(this.selectionRect.startX, this.selectionRect.startY, 3, 0, Math.PI * 2);
      tempCtx.fill();
    }
  }

  drawSelection(event: MouseEvent): void {
    if (!this.selectionRect.drawing || !this.modifiedCtx || !this.currentImageData) return;
    
    const rect = this.modifiedCanvasRef.nativeElement.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;
    
    // Переводимо координати курсора в координати канвасу 
    // з урахуванням можливого масштабування
    const scaleX = this.modifiedCanvasRef.nativeElement.width / rect.width;
    const scaleY = this.modifiedCanvasRef.nativeElement.height / rect.height;
    
    this.selectionRect.endX = canvasX * scaleX;
    this.selectionRect.endY = canvasY * scaleY;

    // Перемальовуємо модифіковане зображення з уже застосованими змінами
    this.applyColorManipulation();
    
    // Малюємо рамку виділення
    const tempCanvas = this.modifiedCanvasRef.nativeElement;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (tempCtx) {
      // Малюємо рамку виділення
      tempCtx.strokeStyle = 'rgba(220, 50, 50, 0.7)';
      tempCtx.lineWidth = 1.5;
      tempCtx.strokeRect(
        this.selectionRect.startX,
        this.selectionRect.startY,
        this.selectionRect.endX - this.selectionRect.startX,
        this.selectionRect.endY - this.selectionRect.startY
      );
      
      // Додамо напівпрозоре підсвічування виділеної області
      tempCtx.fillStyle = 'rgba(220, 50, 50, 0.1)';
      tempCtx.fillRect(
        this.selectionRect.startX,
        this.selectionRect.startY,
        this.selectionRect.endX - this.selectionRect.startX,
        this.selectionRect.endY - this.selectionRect.startY
      );
    }
  }

  endSelection(): void {
    if (!this.selectionRect.drawing) return;
    
    this.selectionRect.drawing = false;
    
    // Зберігаємо нормалізоване виділення для застосування змін
    const normalizedSelection = this.getNormalizedSelectionRect();
    console.log('Selected region (normalized):', normalizedSelection);
    
    // Перемальовуємо рамку виділення, щоб вона залишалася видимою
    if (normalizedSelection.width > 0 && normalizedSelection.height > 0) {
      const tempCtx = this.modifiedCanvasRef.nativeElement.getContext('2d');
      if (tempCtx) {
        // Малюємо рамку виділення і додаємо напівпрозорий фон
        tempCtx.strokeStyle = 'rgba(220, 50, 50, 0.7)';
        tempCtx.lineWidth = 1.5;
        tempCtx.strokeRect(
          normalizedSelection.x,
          normalizedSelection.y,
          normalizedSelection.width,
          normalizedSelection.height
        );
        
        tempCtx.fillStyle = 'rgba(220, 50, 50, 0.1)';
        tempCtx.fillRect(
          normalizedSelection.x,
          normalizedSelection.y,
          normalizedSelection.width,
          normalizedSelection.height
        );
      }
    }
  }
  
  getNormalizedSelectionRect() {
    // Перевірка, чи є активна область
    if (!this.isSelectingRegion || 
        (this.selectionRect.startX === this.selectionRect.endX && 
         this.selectionRect.startY === this.selectionRect.endY)) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    
    const x = Math.min(this.selectionRect.startX, this.selectionRect.endX);
    const y = Math.min(this.selectionRect.startY, this.selectionRect.endY);
    const width = Math.abs(this.selectionRect.endX - this.selectionRect.startX);
    const height = Math.abs(this.selectionRect.endY - this.selectionRect.startY);
    
    return { x, y, width, height };
  }

  applyColorManipulationToRegion(): void {
    if (!this.modifiedCtx || !this.currentImageData || !this.originalImage) return;

    const selection = this.getNormalizedSelectionRect();
    
    if (selection.width === 0 || selection.height === 0) {
      console.warn("Ширина або висота виділення дорівнює нулю, застосовуємо зміни до всього зображення.");
      this.applyColorManipulation();
      return;
    }

    // Створюємо новий ImageData з оригінальних пікселів
    const newImageData = new ImageData(
      new Uint8ClampedArray(this.currentImageData.data),
      this.currentImageData.width,
      this.currentImageData.height
    );
    
    const data = newImageData.data;
    const canvasWidth = newImageData.width;

    // Використовуємо поточні RGB значення для маніпуляції
    const { r: r_adj, g: g_adj, b: b_adj } = this.rgbValues;
    
    // Фактори для маніпуляції кольором
    const rFactor = r_adj / 128.0;
    const gFactor = g_adj / 128.0;
    const bFactor = b_adj / 128.0;

    // Перебираємо пікселі тільки у виділеній області
    for (let y = Math.floor(selection.y); y < Math.floor(selection.y + selection.height); y++) {
      for (let x = Math.floor(selection.x); x < Math.floor(selection.x + selection.width); x++) {
        const idx = (y * canvasWidth + x) * 4;
        
        // Застосовуємо множник до кожного кольорового каналу
        data[idx] = Math.min(255, Math.max(0, data[idx] * rFactor));
        data[idx+1] = Math.min(255, Math.max(0, data[idx+1] * gFactor));
        data[idx+2] = Math.min(255, Math.max(0, data[idx+2] * bFactor));
      }
    }
    
    this.modifiedCtx.putImageData(newImageData, 0, 0);      // Повторно намалювати рамку виділення, щоб її було видно
    if (this.isSelectingRegion) {
      const tempCtx = this.modifiedCanvasRef.nativeElement.getContext('2d');
      if (tempCtx) {
        tempCtx.strokeStyle = 'rgba(220, 50, 50, 0.7)';
        tempCtx.lineWidth = 1.5;
        tempCtx.strokeRect(
          selection.x,
          selection.y,
          selection.width,
          selection.height
        );
        
        // Додаємо напівпрозорий фон для виділеної області
        tempCtx.fillStyle = 'rgba(220, 50, 50, 0.1)';
        tempCtx.fillRect(
          selection.x,
          selection.y,
          selection.width,
          selection.height
        );
      }
    }
    
    console.log("Застосовано зміни до виділеної області.");
  }

  toggleRegionSelectionMode(): void {
    this.isSelectingRegion = !this.isSelectingRegion;
    
    if (!this.isSelectingRegion) {
      // Скидаємо вибір області
      this.selectionRect = {startX: 0, startY: 0, endX: 0, endY: 0, drawing: false};
      
      // Перемальовуємо зображення без виділеної області
      if (this.originalImage && this.currentImageData) {
        this.applyColorManipulation();
      }
    } else if (this.isSelectingRegion && this.originalImage && this.currentImageData) {
      // Показуємо користувачу інструкцію щодо вибору області через повідомлення в інтерфейсі,
      // а не через спливаюче вікно alert, що краще для UX
      console.log("Режим вибору області активовано. Виберіть область на зображенні.");
    }
    
    console.log("Режим вибору області:", this.isSelectingRegion);
  }
  
  /**
   * Зберегти модифіковане зображення на пристрій користувача
   */
  downloadModifiedImage(): void {
    if (!this.modifiedCanvasRef || !this.currentImageData) return;
    
    // Отримуємо canvas з відредагованим зображенням
    const canvas = this.modifiedCanvasRef.nativeElement;
    
    // Створюємо тимчасовий canvas без виділеної області
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    if (!tempCtx) return;
    
    // Встановлюємо розміри полотна
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    
    // Копіюємо зображення безпосередньо на тимчасовий canvas
    tempCtx.drawImage(canvas, 0, 0);
    
    // Конвертуємо canvas у формат даних URL
    const dataUrl = tempCanvas.toDataURL('image/png');
    
    // Створюємо посилання для завантаження
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = this.fileName;
    
    // Додаємо посилання у DOM (невидиме), клікаємо і видаляємо
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log("Зображення збережено як", this.fileName);
  }
  
  /**
   * Застосовує пресети колірних фільтрів до зображення
   * @param presetName Назва пресету
   */
  applyPreset(presetName: string): void {
    if (!this.originalImage || !this.currentImageData) return;
    
    // Скидаємо виділення області при застосуванні пресету
    this.isSelectingRegion = false;
    this.selectionRect = {startX: 0, startY: 0, endX: 0, endY: 0, drawing: false};
    
    // Зберігаємо поточну активну колірну систему
    const currentSystem = this.activeColorSystem;
    
    // Перемикаємося на RGB для всіх фільтрів
    this.activeColorSystem = 'RGB';
    
    switch(presetName) {
      case 'original':
        // Повернення до оригінального зображення (скидання всіх змін)
        if (!this.originalCtx || !this.modifiedCtx || !this.originalImage) return;
        
        // Перемальовуємо оригінальне зображення на модифікований canvas
        const width = this.originalCanvasRef.nativeElement.width;
        const height = this.originalCanvasRef.nativeElement.height;
        this.originalCtx.drawImage(this.originalImage, 0, 0, width, height);
        this.currentImageData = this.originalCtx.getImageData(0, 0, width, height);
        this.modifiedCtx.putImageData(this.currentImageData, 0, 0);
        
        // Скидаємо значення кольорів до початкових
        this.resetColorValuesToDefaults();
        this.convertRGBToActiveSystem();
        return;
        
      case 'grayscale':
        // Справжній чорно-білий фільтр - застосовуємо до зображення безпосередньо
        if (!this.modifiedCtx || !this.currentImageData) return;
        
        // Створюємо новий ImageData для застосування фільтру
        const grayscaleImageData = new ImageData(
          new Uint8ClampedArray(this.currentImageData.data), 
          this.currentImageData.width,
          this.currentImageData.height
        );
        
        // Застосовуємо чорно-білий фільтр до кожного пікселя
        for (let i = 0; i < grayscaleImageData.data.length; i += 4) {
          // Стандартна формула для перетворення RGB в відтінки сірого
          const gray = 0.299 * grayscaleImageData.data[i] + 
                      0.587 * grayscaleImageData.data[i+1] + 
                      0.114 * grayscaleImageData.data[i+2];
          
          grayscaleImageData.data[i] = gray;     // R
          grayscaleImageData.data[i+1] = gray;   // G
          grayscaleImageData.data[i+2] = gray;   // B
          // Alpha залишається без змін
        }
        
        // Відображаємо обробленне зображення
        this.modifiedCtx.putImageData(grayscaleImageData, 0, 0);
        
        // Встановлюємо нейтральні значення RGB
        this.rgbValues = { r: 128, g: 128, b: 128 };
        this.convertRGBToActiveSystem();
        return;
        
      case 'sepia':
        // Сепія фільтр
        if (!this.modifiedCtx || !this.currentImageData) return;
        
        // Створюємо новий ImageData для застосування фільтру
        const sepiaImageData = new ImageData(
          new Uint8ClampedArray(this.currentImageData.data), 
          this.currentImageData.width,
          this.currentImageData.height
        );
        
        // Застосовуємо сепія фільтр до кожного пікселя
        for (let i = 0; i < sepiaImageData.data.length; i += 4) {
          const r = sepiaImageData.data[i];
          const g = sepiaImageData.data[i+1];
          const b = sepiaImageData.data[i+2];
          
          // Формула для створення ефекту сепії
          sepiaImageData.data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189)); // червоний
          sepiaImageData.data[i+1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168)); // зелений
          sepiaImageData.data[i+2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131)); // синій
          // Alpha залишається без змін
        }
        
        // Відображаємо обробленне зображення
        this.modifiedCtx.putImageData(sepiaImageData, 0, 0);
        
        // Встановлюємо значення RGB для сепії
        this.rgbValues = { r: 200, g: 150, b: 100 };
        this.convertRGBToActiveSystem();
        return;
        
      case 'negative':
        // Негативний фільтр - інвертуємо всі кольори
        if (!this.modifiedCtx || !this.currentImageData) return;
        
        // Створюємо новий ImageData для застосування фільтру
        const negativeImageData = new ImageData(
          new Uint8ClampedArray(this.currentImageData.data), 
          this.currentImageData.width,
          this.currentImageData.height
        );
        
        // Застосовуємо негативний фільтр до кожного пікселя
        for (let i = 0; i < negativeImageData.data.length; i += 4) {
          negativeImageData.data[i] = 255 - negativeImageData.data[i];         // R
          negativeImageData.data[i+1] = 255 - negativeImageData.data[i+1];     // G
          negativeImageData.data[i+2] = 255 - negativeImageData.data[i+2];     // B
          // Alpha залишається без змін
        }
        
        // Відображаємо обробленне зображення
        this.modifiedCtx.putImageData(negativeImageData, 0, 0);
        
        // Відновлюємо стандартні RGB значення після застосування фільтру
        this.rgbValues = { r: 128, g: 128, b: 128 };
        this.convertRGBToActiveSystem();
        return;
        
      default:
        return;
    }
  }
  
  // Додаємо цей метод для завантаження зображення за URL
  loadImageFromUrl(url: string): void {
    if (!url) return;
    
    this.originalImage = new Image();
    this.originalImage.crossOrigin = 'anonymous';
    this.originalImage.onload = () => {
      if (this.originalCanvasRef && this.originalCanvasRef.nativeElement && 
          this.modifiedCanvasRef && this.modifiedCanvasRef.nativeElement && 
          this.originalCtx && this.modifiedCtx) {
        
        // Set canvas size based on image
        const canvas = this.originalCanvasRef.nativeElement;
        const modCanvas = this.modifiedCanvasRef.nativeElement;
        
        // Maintain aspect ratio
        const maxWidth = 600;
        const maxHeight = 400;
        let width = this.originalImage!.width;
        let height = this.originalImage!.height;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = modCanvas.width = width;
        canvas.height = modCanvas.height = height;
        
        // Draw original image
        this.originalCtx.drawImage(this.originalImage!, 0, 0, width, height);
        
        // Save image data for manipulation
        this.currentImageData = this.originalCtx.getImageData(0, 0, width, height);
        
        // Draw modified image (initially same as original)
        this.modifiedCtx.putImageData(this.currentImageData, 0, 0);
      }
    };
    this.originalImage.onerror = () => {
      console.error('Error loading image from URL:', url);
      this.setDefaultCanvasAppearance();
    };
    this.originalImage.src = url;
  }
}
