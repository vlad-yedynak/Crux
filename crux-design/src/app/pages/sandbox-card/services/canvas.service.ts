import { Injectable, ElementRef } from '@angular/core';

export interface ShapeData {
  id: string; 
  type: string; 
  name: string; 
  points: Point[];
  fillColor: string;
  borderColor: string;
  isPlaceholder?: boolean; 
  radius?: number; 
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
  private nextShapeId = 0; 
  private tempShape: ShapeData | null = null;

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
    
    if (this.tempShape && this.tempShape.points.length > 0) {
      this.drawTempShape();
    }
    
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
      if (shape.isPlaceholder) continue;
      
      this.ctx.beginPath();
      
      if (shape.type === 'circle' && shape.points.length === 1 && shape.radius !== undefined && shape.radius > 0) {
        const center = shape.points[0];
        const transformedCenter = new Point(
          transformedPosition.x + center.x * this.scale,
          transformedPosition.y - center.y * this.scale
        );
        const scaledRadius = shape.radius * this.scale;
        this.ctx.arc(transformedCenter.x, transformedCenter.y, scaledRadius, 0, Math.PI * 2);
      } else if (shape.points.length > 0) { 
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
      }


      this.ctx.fillStyle = shape.fillColor;
      this.ctx.fill();
      this.ctx.strokeStyle = shape.borderColor;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
  }

  private drawTempShape(): void {
    if (!this.tempShape || this.tempShape.points.length === 0) return;

    let viewWidth = this.canvasElement.width;
    let viewHeight = this.canvasElement.height;
    const transformedPosition = this.currentPosition.transform(viewWidth, viewHeight, this.scale);

    this.ctx.beginPath();

    if (this.tempShape.type === 'circle' && this.tempShape.points.length === 1 && this.tempShape.radius !== undefined && this.tempShape.radius > 0) {
      const center = this.tempShape.points[0];
      const transformedCenter = new Point(
        transformedPosition.x + center.x * this.scale,
        transformedPosition.y - center.y * this.scale
      );
      const scaledRadius = this.tempShape.radius * this.scale;
      this.ctx.arc(transformedCenter.x, transformedCenter.y, scaledRadius, 0, Math.PI * 2);
      
       this.ctx.fillStyle = this.tempShape.fillColor; 
       this.ctx.fill(); 
       this.ctx.strokeStyle = this.tempShape.borderColor;
       this.ctx.lineWidth = 2;
       this.ctx.stroke(); 

      this.ctx.beginPath(); 
      this.ctx.arc(transformedCenter.x, transformedCenter.y, 5, 0, Math.PI * 2); 
      this.ctx.fillStyle = this.tempShape.borderColor; 
      this.ctx.fill();


    } else if (this.tempShape.points.length > 0) { 
      const firstPoint = this.tempShape.points[0];
      const transformedFirstPoint = new Point(
        transformedPosition.x + firstPoint.x * this.scale,
        transformedPosition.y - firstPoint.y * this.scale
      );
      this.ctx.moveTo(transformedFirstPoint.x, transformedFirstPoint.y);

      for (let i = 1; i < this.tempShape.points.length; i++) {
        const point = this.tempShape.points[i];
        const transformedPoint = new Point(
          transformedPosition.x + point.x * this.scale,
          transformedPosition.y - point.y * this.scale
        );
        this.ctx.lineTo(transformedPoint.x, transformedPoint.y);
      }

      if (this.tempShape.points.length >= 3) {
        this.ctx.save();
        this.ctx.setLineDash([5, 3]);
        this.ctx.lineTo(transformedFirstPoint.x, transformedFirstPoint.y);
        this.ctx.restore();
      }
      
      this.ctx.strokeStyle = this.tempShape.borderColor;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      for (const point of this.tempShape.points) {
        const transformedPoint = new Point(
          transformedPosition.x + point.x * this.scale,
          transformedPosition.y - point.y * this.scale
        );
        
        this.ctx.beginPath();
        this.ctx.arc(transformedPoint.x, transformedPoint.y, 5, 0, Math.PI * 2);
        this.ctx.fillStyle = this.tempShape.fillColor;
        this.ctx.fill();
        this.ctx.strokeStyle = this.tempShape.borderColor;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
      }
    }
  }
  
  public setTempShape(shape: ShapeData | null): void {
    this.tempShape = shape ? { ...shape, points: [...shape.points] } : null;
    this.draw();
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

  public drawShape(type: string, points: Point[], fillColor: string, borderColor: string, name?: string, radius?: number): string {
    
    if (type === 'circle') {
      if (!points || points.length !== 1) {
        console.error('A circle requires exactly 1 point (the center).');
        return '';
      }
      if (radius === undefined || radius <= 0) {
        console.error('A circle requires a positive radius.');
        return '';
      }
    } else { 
      if (!points || points.length < 2) { 
        console.error('Polygons (like squares, triangles, rectangles) require at least 2 points.');
        return '';
      }
    }

    const newId = `shape-${this.nextShapeId++}`;
    const newShape: ShapeData = { 
      id: newId, 
      type, 
      name: name || type, 
      points: [...points], 
      fillColor, 
      borderColor, 
      isPlaceholder: false
    };

    if (type === 'circle' && radius !== undefined) {
      newShape.radius = radius;
    }

    this.shapes.push(newShape);
    
    this.draw();
    return newId; 
  }

  public updateShape(id: string, type: string, points: Point[], fillColor: string, borderColor: string, name?: string, radius?: number): boolean {
    const shapeIndex = this.shapes.findIndex(s => s.id === id);
    if (shapeIndex === -1) {
      console.error(`Shape with id ${id} not found`);
      return false;
    }
    
    this.shapes[shapeIndex] = {
      ...this.shapes[shapeIndex],
      type,
      name: name || this.shapes[shapeIndex].name,
      points: [...points],
      fillColor, 
      borderColor,
      isPlaceholder: false
    };
    
    if (type === 'circle') {
      this.shapes[shapeIndex].radius = radius;
    } else {
      delete this.shapes[shapeIndex].radius;
    }
    
    this.draw();
    return true;
  }

  public getShapes(): ShapeData[] {
    return [...this.shapes.filter(shape => !shape.isPlaceholder)]; 
  }

  public deleteShape(id: string): void {
    this.shapes = this.shapes.filter(shape => shape.id !== id);
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
  
  public vectorTo(point: Point): {x: number, y: number} {
      return {
          x: point.x - this.x,
          y: point.y - this.y
      };
  }
}

export function dotProduct(v1: {x: number, y: number}, v2: {x: number, y: number}): number {
    return v1.x * v2.x + v1.y * v2.y;
}

export function magnitude(v: {x: number, y: number}): number {
    return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function arePerpendicular(v1: {x: number, y: number}, v2: {x: number, y: number}, tolerance: number = 0.01): boolean {
    const dot = dotProduct(v1, v2);
    return Math.abs(dot) <= tolerance * magnitude(v1) * magnitude(v2);
}

export function haveSameLength(v1: {x: number, y: number}, v2: {x: number, y: number}, tolerance: number = 0.01): boolean {
    const len1 = magnitude(v1);
    const len2 = magnitude(v2);
    return Math.abs(len1 - len2) <= tolerance * Math.max(len1, len2);
}

export function arePointsEqual(p1: Point, p2: Point, tolerance: number = 0.001): boolean {
    return Math.abs(p1.x - p2.x) < tolerance && Math.abs(p1.y - p2.y) < tolerance;
}
export function arePointsUnique(points: Point[]): boolean {
    if (points.length <= 1) return true;
    
    for (let i = 0; i < points.length - 1; i++) {
        for (let j = i + 1; j < points.length; j++) {
            if (arePointsEqual(points[i], points[j])) {
                return false; 
            }
        }
    }
    return true;
}

export function validatePolygonPoints(points: Point[], currentIndex: number): boolean {
    if (currentIndex >= points.length) return true;
    const relevantPointsForUniqueness = points.slice(0, currentIndex + 1);
    if (!arePointsUnique(relevantPointsForUniqueness)) {
        return false;
    }
    return true;
}

export function validateSquarePoints(points: Point[], currentIndex: number): boolean {
    if (currentIndex >= points.length) return true; 
    const relevantPointsForUniqueness = points.slice(0, currentIndex + 1);
    if (!arePointsUnique(relevantPointsForUniqueness)) {
        return false; 
    }

    if (currentIndex === 0) {
        return true; 
    }
    if (currentIndex === 1) {
        
        return true;
    }
    if (currentIndex === 2 && points.length >= 3) {
        const v1 = points[0].vectorTo(points[1]);
        const v2 = points[1].vectorTo(points[2]);
        return arePerpendicular(v1, v2) && haveSameLength(v1, v2);
    }
    if (currentIndex === 3 && points.length >= 4) {
        const v01 = points[0].vectorTo(points[1]);
        const v12 = points[1].vectorTo(points[2]);
        const v23 = points[2].vectorTo(points[3]);
        const v30 = points[3].vectorTo(points[0]);
        
        return arePerpendicular(v01, v12) && haveSameLength(v01, v12) &&
               arePerpendicular(v12, v23) && haveSameLength(v12, v23) &&
               arePerpendicular(v23, v30) && haveSameLength(v23, v30) &&
               arePerpendicular(v30, v01) && haveSameLength(v30, v01);
    }
    
    return true;
}
export function validateRectanglePoints(points: Point[], currentIndex: number): boolean {
    
    if (currentIndex >= points.length) return true; 
    const relevantPointsForUniqueness = points.slice(0, currentIndex + 1);
    if (!arePointsUnique(relevantPointsForUniqueness)) {
        return false; 
    }

    if (currentIndex === 0) {
        return true; 
    }
    if (currentIndex === 1) {
        return true; 
    }
    if (currentIndex === 2 && points.length >= 3) {
        const v01 = points[0].vectorTo(points[1]);
        const v12 = points[1].vectorTo(points[2]);
        return arePerpendicular(v01, v12);
    }
    if (currentIndex === 3 && points.length >= 4) {
        const v01 = points[0].vectorTo(points[1]);
        const v12 = points[1].vectorTo(points[2]);
        const v23 = points[2].vectorTo(points[3]);
        const v30 = points[3].vectorTo(points[0]);
        
        return arePerpendicular(v01, v12) &&
               arePerpendicular(v12, v23) &&
               arePerpendicular(v23, v30) &&
               arePerpendicular(v30, v01);
    }
    
    return true; 
}

export function validateCircleData(points: Point[], radius: number | undefined, currentIndex: number): boolean {
    if (currentIndex === 0 && points.length === 1) {
        return radius !== undefined && radius > 0;
    }
    return false; 
}

export function validateTrianglePoints(points: Point[], currentIndex: number): boolean {
    
    if (currentIndex >= points.length) return true;
    const relevantPointsForUniqueness = points.slice(0, currentIndex + 1);
    if (!arePointsUnique(relevantPointsForUniqueness)) {
        return false;
    }

    if (currentIndex === 0) return true;
    if (currentIndex === 1) return true; 

    if (currentIndex === 2 && points.length >= 3) {
        const v1 = points[0].vectorTo(points[1]); 
        const v2 = points[0].vectorTo(points[2]); 
        
        const crossProduct = v1.x * v2.y - v1.y * v2.x;
        return Math.abs(crossProduct) > 0.01; 
    }
    
    return true;
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

  public drawShape(type: string, points: Point[], fillColor: string, borderColor: string, name?: string, radius?: number): string {
    if (this.controllerInstance) {
      return this.controllerInstance.drawShape(type, points, fillColor, borderColor, name, radius);
    } else {
      console.error('Canvas controller not initialized');
      return '';
    }
  }

  public updateShape(id: string, type: string, points: Point[], fillColor: string, borderColor: string, name?: string, radius?: number): boolean {
    if (this.controllerInstance) {
      return this.controllerInstance.updateShape(id, type, points, fillColor, borderColor, name, radius);
    } else {
      console.error('Canvas controller not initialized');
      return false;
    }
  }

  public getDrawnShapes(): ShapeData[] {
    if (this.controllerInstance) {
      return this.controllerInstance.getShapes();
    }
    console.error('Canvas controller not initialized');
    return [];
  }

  public deleteShape(id: string): void {
    if (this.controllerInstance) {
      this.controllerInstance.deleteShape(id);
      this.saveShapesToLocalStorage();
      console.log(`Shape ${id} deleted and localStorage updated`);
    } else {
      console.error('Canvas controller not initialized');
    }
  }

  public clearShapes(): void {
    if (this.controllerInstance) {
      this.controllerInstance.clearShapes();
      localStorage.removeItem('savedCanvasShapes');
      console.log('All shapes cleared from canvas and localStorage');
    } else {
      console.error('Canvas controller not initialized');
    }
  }

  public setTempShape(shape: ShapeData | null): void {
    if (this.controllerInstance) {
      this.controllerInstance.setTempShape(shape);
    } else {
      console.error('Canvas controller not initialized');
    }
  }

  public saveShapesToLocalStorage(): void {
    if (this.controllerInstance) {
      const shapes = this.controllerInstance.getShapes();
      
      const serializableShapes = shapes.map(shape => ({
        ...shape,
        points: shape.points.map(point => ({
          x: point.x,
          y: point.y
        }))
      }));
      
      localStorage.setItem('savedCanvasShapes', JSON.stringify(serializableShapes));
      console.log('Saved shapes to localStorage:', serializableShapes);
    }
  }

  public loadShapesFromLocalStorage(): ShapeData[] {
    try {
      const savedShapes = localStorage.getItem('savedCanvasShapes');
      if (savedShapes) {
        const parsedShapes = JSON.parse(savedShapes);
        console.log('Loaded shapes from localStorage:', parsedShapes);
        
        const convertedShapes = parsedShapes.map((shape: any) => ({
          ...shape,
          points: Array.isArray(shape.points) 
            ? shape.points.map((p: any) => new Point(Number(p.x), Number(p.y)))
            : []
        }));
        
        console.log('Converted shapes with proper Point instances:', convertedShapes);
        return convertedShapes;
      }
    } catch (error) {
      console.error('Error loading shapes from localStorage:', error);
    }
    return [];
  }

  public restoreShapes(shapes: ShapeData[]): void {
    if (!this.controllerInstance) {
      console.error('Canvas controller not initialized for shape restoration');
      return;
    }
    
    if (!shapes || shapes.length === 0) {
      console.log('No shapes to restore');
      return;
    }

    console.log('Restoring shapes:', shapes);
    
    this.controllerInstance.clearShapes();

    for (const shape of shapes) {
      const pointInstances = shape.points.map((p: any) => 
        p instanceof Point ? p : new Point(Number(p.x), Number(p.y))
      );
      
      console.log(`Restoring shape: ${shape.name}, points:`, pointInstances, `radius: ${shape.radius}`);
      
      this.controllerInstance.drawShape(
        shape.type,
        pointInstances,
        shape.fillColor,
        shape.borderColor,
        shape.name,
        shape.radius 
      );
    }

    this.controllerInstance.draw();
  }
}
