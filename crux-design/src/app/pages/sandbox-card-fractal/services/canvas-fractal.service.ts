import { Injectable, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export class CanvasFractalController {
  private ctx: CanvasRenderingContext2D;
  private canvasElement: HTMLCanvasElement;
  private scale: number;
  private currentPosition: Point;
  private _isDragging: boolean = false;
  private _currentX: number = 0;
  private _currentY: number = 0;
  private _lastMouseX: number = 0;
  private _lastMouseY: number = 0;
  private readonly SCALE_SPEED = 1.025;

  // Track dragging state
  private _wasDragging: boolean = false;
  private _dragEndTime: number = 0;
  private _minimumDragDistance: number = 5; // Minimum pixels to consider it a drag
  private _dragStartX: number = 0;
  private _dragStartY: number = 0;

  constructor(canvasEl: HTMLCanvasElement) {
    this.canvasElement = canvasEl;
    this.ctx = <CanvasRenderingContext2D>this.canvasElement.getContext('2d');
    this.scale = 50;
    this.currentPosition = new Point(0, 0);
    if (!this.ctx) {
      console.error('Unable to get 2D context');
    }
  }

  public initialize(width: number, height: number): void {
    if (!this.canvasElement || !this.ctx) {
      console.error('Canvas not initialized properly.');
      return;
    }
    this.canvasElement.width = width;
    this.canvasElement.height = height;
    this.ctx.canvas.width = width;
    this.ctx.canvas.height = height;

    // Removed mouse event listeners initialization
    // this.initializeListeners();
    this.draw();
    console.log(`Canvas initialized with width: ${width}, height: ${height}`);
  }

  // Commented out event listeners initialization
  /*
  private initializeListeners(): void {
    this.canvasElement.addEventListener('wheel', (e: WheelEvent) => this.onWheel(e), false);
    this.canvasElement.addEventListener('mousedown', (e: MouseEvent) => {
      this.onDragStart(e);
    });
    
    this.canvasElement.addEventListener('mousemove', (e: MouseEvent) => {
      this.onDragMove(e);
    });
    
    this.canvasElement.addEventListener('mouseup', () => {
      this.onDragEnd();
    });
    
    this.canvasElement.addEventListener('mouseleave', () => {
      this.onDragEnd();
    });
  }
  */

  public rescale(newScale: number): void {
    this.scale = newScale;
  }

  public draw(): void {
    if (!this.ctx || !this.canvasElement) return;
    
    this.ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    
    // Draw grid or background elements if needed
    this.drawGrid();
  }
  
  private drawGrid(): void {
    // Optional: Draw a coordinate grid to help visualize the space
    if (!this.ctx || !this.canvasElement) return;
    
    const width = this.canvasElement.width;
    const height = this.canvasElement.height;
    
    // Set grid style
    this.ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
    this.ctx.lineWidth = 0.5;
    
    const transformedOrigin = this.currentPosition.transform(width, height, this.scale);
    
    // Draw horizontal lines
    const spacingY = 50; // pixels between grid lines
    const numLinesY = Math.ceil(height / spacingY) + 1;
    const startY = transformedOrigin.y % spacingY;
    
    for (let i = 0; i < numLinesY; i++) {
      const y = startY + i * spacingY;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
      this.ctx.stroke();
    }
    
    // Draw vertical lines
    const spacingX = 50; // pixels between grid lines
    const numLinesX = Math.ceil(width / spacingX) + 1;
    const startX = transformedOrigin.x % spacingX;
    
    for (let i = 0; i < numLinesX; i++) {
      const x = startX + i * spacingX;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
      this.ctx.stroke();
    }
    
    // Draw coordinate axes if visible
    this.ctx.strokeStyle = 'rgba(150, 150, 150, 0.5)';
    this.ctx.lineWidth = 1;
    
    // x-axis
    if (transformedOrigin.y >= 0 && transformedOrigin.y <= height) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, transformedOrigin.y);
      this.ctx.lineTo(width, transformedOrigin.y);
      this.ctx.stroke();
    }
    
    // y-axis
    if (transformedOrigin.x >= 0 && transformedOrigin.x <= width) {
      this.ctx.beginPath();
      this.ctx.moveTo(transformedOrigin.x, 0);
      this.ctx.lineTo(transformedOrigin.x, height);
      this.ctx.stroke();
    }
  }

  // Disabled wheel event handler
  public onWheel(e: WheelEvent): void {
    // Zoom functionality disabled
    e.preventDefault();
    // No-op - zoom functionality removed
  }

  // Disabled dragging methods
  private onDragStart(event: MouseEvent): void {
    // No-op - drag functionality removed
  }
  
  private onDragMove(event: MouseEvent): void {
    // No-op - drag functionality removed
  }

  private onDragEnd(): void {
    // No-op - drag functionality removed
  }
  
  private updatePosition(deltaX: number, deltaY: number): void {
    // No-op - position update functionality removed
  }

  public move(position: Point): void {
    this.currentPosition = position;
  }
  
  public handleCanvasClick(event: MouseEvent): {x: number, y: number} | null {
    // Get the click position in canvas coordinates
    const rect = this.canvasElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const viewWidth = this.canvasElement.width;
    const viewHeight = this.canvasElement.height;
    const transformedPosition = this.currentPosition.transform(viewWidth, viewHeight, this.scale);
    
    // Convert screen coordinates to world coordinates
    const worldX = (x - transformedPosition.x) / this.scale;
    const worldY = (transformedPosition.y - y) / this.scale;
    
    return {x: worldX, y: worldY};
  }
  
  public clearCanvas(): void {
    this.ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    this.draw();
  }

  public wasDraggingRecently(): boolean {
    // Always return false since dragging is disabled
    return false;
  }
  
  public resetDragState(): void {
    // No-op - drag functionality removed
  }

  public drawPoint(point: {x: number, y: number}, color: string, radius: number = 3): void {
    if (!this.ctx || !this.canvasElement) return;
    
    const viewWidth = this.canvasElement.width;
    const viewHeight = this.canvasElement.height;
    const transformedPosition = this.currentPosition.transform(viewWidth, viewHeight, this.scale);
    
    // Convert world coordinates to screen coordinates
    const screenX = transformedPosition.x + point.x * this.scale;
    const screenY = transformedPosition.y - point.y * this.scale;
    
    // Draw the point as a circle
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  public drawLine(from: {x: number, y: number}, to: {x: number, y: number}, color: string, width: number = 1): void {
    if (!this.ctx || !this.canvasElement) return;
    
    const viewWidth = this.canvasElement.width;
    const viewHeight = this.canvasElement.height;
    const transformedPosition = this.currentPosition.transform(viewWidth, viewHeight, this.scale);
    
    // Convert world coordinates to screen coordinates
    const fromScreenX = transformedPosition.x + from.x * this.scale;
    const fromScreenY = transformedPosition.y - from.y * this.scale;
    const toScreenX = transformedPosition.x + to.x * this.scale;
    const toScreenY = transformedPosition.y - to.y * this.scale;
    
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width;
    this.ctx.beginPath();
    this.ctx.moveTo(fromScreenX, fromScreenY);
    this.ctx.lineTo(toScreenX, toScreenY);
    this.ctx.stroke();
  }

  public getScale(): number {
    return this.scale;
  }

  public getCurrentPosition(): Point {
    return this.currentPosition;
  }

  public getCanvasSize(): {width: number, height: number} {
    return {
      width: this.canvasElement.width,
      height: this.canvasElement.height
    };
  }
  
  public getContext(): CanvasRenderingContext2D | null {
    return this.ctx;
  }
  
  public getCanvas(): HTMLCanvasElement | null {
    return this.canvasElement;
  }
}

export class Point {
  private _x: number;
  private _y: number;

  public constructor(x: number, y: number) {
      this._x = x;
      this._y = y;
  }

  public get x(): number {
      return this._x;
  }

  public get y(): number {
      return this._y;
  }

  public set x(value: number) {
      this._x = value;
  }

  public set y(value: number) {
      this._y = value;
  }

  public transform(viewWidth: number, viewHeight: number, scale: number): Point {
      let transformedX = viewWidth * 0.5 + this._x * scale;
      let transformedY = viewHeight * 0.5 - this._y * scale;

      return new Point(transformedX, transformedY);
  }

  public offset(scale: number): Point {
      let offsetX = this._x * scale;
      let offsetY = -this._y * scale;

      return new Point(offsetX, offsetY);
  }
  
  public distanceTo(point: Point): number {
      return Math.sqrt(
          (point.x - this.x) * (point.x - this.x) +
          (point.y - this.y) * (point.y - this.y)
      );
  }
  
  public vectorTo(point: Point): {x: number, y: number} {
      return {
          x: point.x - this.x,
          y: point.y - this.y
      };
  }
}

@Injectable({
  providedIn: 'root'
})
export class CanvasFractalService {
  private controllerInstance: CanvasFractalController | null = null;
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  public initializeCanvas(
    canvasElRef: ElementRef<HTMLCanvasElement>,
    width: number,
    height: number
  ): void {
    if (!this.isBrowser) return;
    
    if (canvasElRef && canvasElRef.nativeElement) {
      const canvas = canvasElRef.nativeElement;
      
      this.controllerInstance = new CanvasFractalController(canvas);
      
      this.controllerInstance.initialize(width, height);
    } else {
      console.error('Canvas element or container element not provided or not found.');
    }
  }

  public onWheel(e: WheelEvent): void {
    if (this.controllerInstance) {
      this.controllerInstance.onWheel(e);
    }
  }

  public move(position: Point): void {
    if (this.controllerInstance) {
      this.controllerInstance.move(position);
    }
  }

  public rescale(scale: number): void {
    if (this.controllerInstance) {
      this.controllerInstance.rescale(scale);
    }
  }
  
  public handleCanvasClick(event: MouseEvent): {x: number, y: number} | null {
    if (this.controllerInstance) {
      return this.controllerInstance.handleCanvasClick(event);
    }
    return null;
  }
  
  public clearCanvas(): void {
    if (this.controllerInstance) {
      this.controllerInstance.clearCanvas();
    }
  }
  
  public wasDraggingRecently(): boolean {
    if (this.controllerInstance) {
      return this.controllerInstance.wasDraggingRecently();
    }
    return false;
  }
  
  public resetDragState(): void {
    if (this.controllerInstance) {
      this.controllerInstance.resetDragState();
    }
  }

  public drawPoint(point: {x: number, y: number}, color: string, radius: number = 3): void {
    if (this.controllerInstance) {
      this.controllerInstance.drawPoint(point, color, radius);
    }
  }

  public drawLine(from: {x: number, y: number}, to: {x: number, y: number}, color: string, width: number = 1): void {
    if (this.controllerInstance) {
      this.controllerInstance.drawLine(from, to, color, width);
    }
  }

  public getScale(): number {
    if (this.controllerInstance) {
      return this.controllerInstance.getScale();
    }
    return 50;
  }

  public getCurrentPosition(): Point {
    if (this.controllerInstance) {
      return this.controllerInstance.getCurrentPosition();
    }
    return new Point(0, 0);
  }

  public getCanvasSize(): {width: number, height: number} {
    if (this.controllerInstance) {
      return this.controllerInstance.getCanvasSize();
    }
    return {width: 0, height: 0};
  }

  public getContext(): CanvasRenderingContext2D | null {
    if (this.controllerInstance) {
      return this.controllerInstance.getContext();
    }
    return null;
  }
  
  public getCanvas(): HTMLCanvasElement | null {
    if (this.controllerInstance) {
      return this.controllerInstance.getCanvas();
    }
    return null;
  }

  public redraw(): void {
    if (this.controllerInstance) {
      this.controllerInstance.draw();
    }
  }
}
