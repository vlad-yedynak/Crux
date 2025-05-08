import { Injectable, ElementRef } from '@angular/core';

export interface ShapeData {
  points: Point[];
  fillColor: string;
  borderColor: string;
}

export class CanvasController {
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
  private shapes: ShapeData[] = [];

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

    this.initializeListeners();
    this.drawGrid();
    this.drawAbscissaAxis();
    this.drawOrdinateAxis();
    this.drawLabels();
    console.log(`Canvas initialized with width: ${width}, height: ${height}`);
  }

  private initializeListeners(): void {
    this.canvasElement.addEventListener('wheel', (e: WheelEvent) => this.onWheel(e), false);
    this.canvasElement.addEventListener('mousedown', (e: MouseEvent) => this.onDragStart(e));
    this.canvasElement.addEventListener('mousemove', (e: MouseEvent) => this.onDragMove(e));
    this.canvasElement.addEventListener('mouseup', () => this.onDragEnd());
    this.canvasElement.addEventListener('mouseleave', () => this.onDragEnd());
  }

  private findStartPosition(start: number, end: number, step: number): number {
    for (let i = start; i <= end; ++i) {
      if (i === 0) {
        continue;
      }

      if (i % step === 0) {
        start = i;
        break;
      }
    }

    return start;
  }

  public calculatePoints() {
    let viewWidth = this.canvasElement.width;
    let viewHeight = this.canvasElement.height;
    let transformedPosition = this.currentPosition.transform(viewWidth, viewHeight, this.scale);
    let minLabelSpacing = 50;
    let step = Math.ceil(minLabelSpacing / this.scale);

    let startX = Math.floor(-transformedPosition.x / this.scale);
    let endX = Math.ceil((viewWidth - transformedPosition.x) / this.scale);
    let startY = -1 * Math.ceil((viewHeight - transformedPosition.y) / this.scale);
    let endY = Math.floor(transformedPosition.y / this.scale);
    let startPoint = new Point(startX, startY);
    let endPoint = new Point(endX, endY);

    return { transformedPosition, step, startPoint, endPoint };
  }

  private drawGrid(): void {
    let viewWidth = this.canvasElement.width;
    let viewHeight = this.canvasElement.height;
    let { transformedPosition, step, startPoint, endPoint } = this.calculatePoints();

    startPoint.x = this.findStartPosition(startPoint.x, endPoint.x, step);
    startPoint.y = this.findStartPosition(startPoint.y, endPoint.y, step);

    this.ctx.strokeStyle = '#e0e0e0';
    this.ctx.lineWidth = 0.5;

    for (let i = startPoint.x; i <= endPoint.x; i += step) {
      let x = transformedPosition.x + i * this.scale;

      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, viewHeight);
      this.ctx.stroke();
    }

    for (let i = startPoint.y; i <= endPoint.y; i += step) {
      let y = transformedPosition.y - i * this.scale;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(viewWidth, y);
      this.ctx.stroke();
    }
  }

  private drawAbscissaAxis(): void {
    let viewWidth = this.canvasElement.width;
    let viewHeight = this.canvasElement.height;
    let transformedPosition = this.currentPosition.transform(viewWidth, viewHeight, this.scale);

    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(0, transformedPosition.y);
    this.ctx.lineTo(viewWidth, transformedPosition.y);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(viewWidth - 10, transformedPosition.y - 5);
    this.ctx.lineTo(viewWidth, transformedPosition.y);
    this.ctx.lineTo(viewWidth - 10, transformedPosition.y + 5);
    this.ctx.stroke();
  }
  private drawOrdinateAxis(): void {
    let viewWidth = this.canvasElement.width;
    let viewHeight = this.canvasElement.height;
    let transformedPosition = this.currentPosition.transform(viewWidth, viewHeight, this.scale);

    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(transformedPosition.x, 0);
    this.ctx.lineTo(transformedPosition.x, viewHeight);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(transformedPosition.x - 5, 10);
    this.ctx.lineTo(transformedPosition.x, 0);
    this.ctx.lineTo(transformedPosition.x + 5, 10);
    this.ctx.stroke();
  }

  private drawLabels(): void {
    let viewWidth = this.canvasElement.width;
    let viewHeight = this.canvasElement.height;
    let { transformedPosition, step, startPoint, endPoint } = this.calculatePoints();

    let labelXOffset = 15;
    let labelYOffset = -15;
    let transformedX = transformedPosition.x;
    let transformedY = transformedPosition.y;

    if (startPoint.y >= 0) {
      labelXOffset = -labelXOffset;
      transformedY = viewHeight;
    } else if (endPoint.y < 0) {
      transformedY = 0;
    }

    if (startPoint.x >= 0) {
      labelYOffset = -labelYOffset;
      transformedX = 0;
    } else if (endPoint.x <= 0) {
      transformedX = viewWidth;
    }

    startPoint.x = this.findStartPosition(startPoint.x, endPoint.x, step);
    startPoint.y = this.findStartPosition(startPoint.y, endPoint.y, step);

    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillStyle = '#000000';

    for (let i = startPoint.x; i <= endPoint.x; i += step) {
      if (i === 0) {
        continue;
      }

      let x = transformedPosition.x + i * this.scale;
      this.ctx.beginPath();
      this.ctx.moveTo(x, transformedY - 3);
      this.ctx.lineTo(x, transformedY + 3);
      this.ctx.stroke();

      this.ctx.fillText(
        i.toString(),
        x,
        transformedY + labelXOffset
      );
    }

    for (let i = startPoint.y; i <= endPoint.y; i += step) {
      if (i === 0) {
        continue;
      }

      let y = transformedPosition.y - i * this.scale;
      this.ctx.beginPath();
      this.ctx.moveTo(transformedX - 3, y);
      this.ctx.lineTo(transformedX + 3, y);
      this.ctx.stroke();
      this.ctx.fillText(
        i.toString(),
        transformedX + labelYOffset,
        y
      );
    }

    this.ctx.fillText('0', transformedPosition.x - 15, transformedPosition.y + 15);
    this.ctx.fillText('X', viewWidth - 10, transformedPosition.y - 15);
    this.ctx.fillText('Y', transformedPosition.x + 15, 10);
  }

  public rescale(newScale: number): void {
    this.scale = newScale;
  }

  public draw(): void {
    this.ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);

    this.drawGrid();
    
    this.drawStoredShapes();
    
    this.drawAbscissaAxis();
    this.drawOrdinateAxis();
    this.drawLabels();
  }

  private drawStoredShapes(): void {
    if (this.shapes.length === 0) return;

    let viewWidth = this.canvasElement.width;
    let viewHeight = this.canvasElement.height;
    const transformedPosition = this.currentPosition.transform(viewWidth, viewHeight, this.scale);

    for (const shape of this.shapes) {
      this.ctx.beginPath();
      
      const firstPoint = shape.points[0];
      const transformedFirstPoint = new Point(
        transformedPosition.x + firstPoint.x * this.scale,
        transformedPosition.y - firstPoint.y * this.scale
      );
      this.ctx.moveTo(transformedFirstPoint.x, transformedFirstPoint.y);

      for (let i = 1; i < shape.points.length; i++) {
        const point = shape.points[i];
        const transformedPoint = new Point(
          transformedPosition.x + point.x * this.scale,
          transformedPosition.y - point.y * this.scale
        );
        this.ctx.lineTo(transformedPoint.x, transformedPoint.y);
      }

      this.ctx.closePath();

      this.ctx.fillStyle = shape.fillColor;
      this.ctx.fill();
      this.ctx.strokeStyle = shape.borderColor;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
  }

  public onWheel(e: WheelEvent): void {
    e.preventDefault();

    if (e.deltaY < 0) {
      this.scale *= this.SCALE_SPEED;
    } else if (e.deltaY > 0) {
      this.scale /= this.SCALE_SPEED;
    }

    this.draw();
  }

  private onDragStart(event: MouseEvent): void {
    this._isDragging = true;
    this._lastMouseX = event.clientX;
    this._lastMouseY = event.clientY;
    this.canvasElement.style.cursor = 'grabbing';
  }
  
  private onDragMove(event: MouseEvent): void {
    if (!this._isDragging) {
      return;
    }

    const deltaX = event.clientX - this._lastMouseX;
    const deltaY = event.clientY - this._lastMouseY;
    this._lastMouseX = event.clientX;
    this._lastMouseY = event.clientY;

    this.updatePosition(deltaX, deltaY);
  }

  private onDragEnd(): void {
    this._isDragging = false;
    this.canvasElement.style.cursor = 'grab';
  }

  private updatePosition(deltaX: number, deltaY: number): void {
    this._currentX += deltaX / this.scale;
    this._currentY -= deltaY / this.scale;

    this.move(new Point(this._currentX, this._currentY));
    this.draw();
  }

  public move(position: Point): void {
    this.currentPosition = position;
  }

  public drawShape(points: Point[], fillColor: string, borderColor: string): void {
    if (!points || points.length < 3) {
      console.error('At least 3 points are required to draw a shape');
      return;
    }

    this.shapes.push({ points: [...points], fillColor, borderColor });
    
    this.draw();
  }

  public clearShapes(): void {
    this.shapes = [];
    this.draw();
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
}

@Injectable({
  providedIn: 'root'
})
export class CanvasService {
  private controllerInstance: CanvasController | null = null;

  constructor() { }

  public initializeCanvas(
    canvasElRef: ElementRef<HTMLCanvasElement>,
    width: number,
    height: number
  ): void {
    if (canvasElRef && canvasElRef.nativeElement) {
      const canvas = canvasElRef.nativeElement;
      
      this.controllerInstance = new CanvasController(canvas);
      this.controllerInstance.initialize(width, height);
    } else {
      console.error('Canvas element or container element not provided or not found.');
    }
  }

  public drawShape(points: Point[], fillColor: string, borderColor: string): void {
    if (this.controllerInstance) {
      this.controllerInstance.drawShape(points, fillColor, borderColor);
    } else {
      console.error('Canvas controller not initialized');
    }
  }

  public clearShapes(): void {
    if (this.controllerInstance) {
      this.controllerInstance.clearShapes();
    } else {
      console.error('Canvas controller not initialized');
    }
  }
}
