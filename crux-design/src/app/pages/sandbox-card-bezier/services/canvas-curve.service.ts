import { Injectable, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export class CanvasCurveController {
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
  private activeCurve: any = null;
  
  // Add variables for point dragging
  private selectedPointIndex: number = -1;
  private isPointDragging: boolean = false;

  // Add properties to store curves
  private curves: any[] = [];
  private activeId: string | null = null;

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

    this.initializeListeners();
    this.drawGrid();
    this.drawAbscissaAxis();
    this.drawOrdinateAxis();
    this.drawLabels();
    console.log(`Canvas initialized with width: ${width}, height: ${height}`);
  }

  private initializeListeners(): void {
    this.canvasElement.addEventListener('wheel', (e: WheelEvent) => this.onWheel(e), false);
    this.canvasElement.addEventListener('mousedown', (e: MouseEvent) => {
      // Check if we're clicking on a point first
      if (this.activeCurve && this.checkPointSelection(e)) {
        this.isPointDragging = true;
      } else {
        // If not clicking on a point, handle regular canvas dragging
        this.onDragStart(e);
      }
    });
    
    this.canvasElement.addEventListener('mousemove', (e: MouseEvent) => {
      if (this.isPointDragging && this.selectedPointIndex >= 0 && this.activeCurve) {
        this.dragSelectedPoint(e);
      } else {
        this.onDragMove(e);
      }
    });
    
    this.canvasElement.addEventListener('mouseup', () => {
      if (this.isPointDragging) {
        this.isPointDragging = false;
      } else {
        this.onDragEnd();
      }
    });
    
    this.canvasElement.addEventListener('mouseleave', () => {
      this.isPointDragging = false;
      this.onDragEnd();
    });
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
    
    this.drawAbscissaAxis();
    this.drawOrdinateAxis();
    this.drawLabels();
    
    // Redraw all curves when transforming the canvas
    if (this.curves.length > 0) {
      this.drawCurvesList(this.curves, this.activeId);
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
    this._dragStartX = event.clientX;
    this._dragStartY = event.clientY;
    this.canvasElement.style.cursor = 'grabbing';
    
    // Reset drag flag at the start of a potential new drag
    this._wasDragging = false;
  }
  
  private onDragMove(event: MouseEvent): void {
    if (!this._isDragging) {
      return;
    }

    const deltaX = event.clientX - this._lastMouseX;
    const deltaY = event.clientY - this._lastMouseY;
    this._lastMouseX = event.clientX;
    this._lastMouseY = event.clientY;
    
    // Calculate total drag distance to determine if it's actually a drag
    const dragDistanceX = Math.abs(event.clientX - this._dragStartX);
    const dragDistanceY = Math.abs(event.clientY - this._dragStartY);
    
    if (dragDistanceX > this._minimumDragDistance || dragDistanceY > this._minimumDragDistance) {
      this._wasDragging = true;
    }

    this.updatePosition(deltaX, deltaY);
  }

  private onDragEnd(): void {
    this._isDragging = false;
    
    // Only set drag end time if we actually dragged
    if (this._wasDragging) {
      this._dragEndTime = Date.now();
    }
    
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

  public drawBezierCurve(curve: any, isActive: boolean = false): void {
    if (!curve || !curve.points || curve.points.length < 2) return;
    
    this.ctx.strokeStyle = curve.color || '#FF5722';
    this.ctx.lineWidth = isActive ? 3 : 2;
    
    const viewWidth = this.canvasElement.width;
    const viewHeight = this.canvasElement.height;
    const transformedPosition = this.currentPosition.transform(viewWidth, viewHeight, this.scale);
    
    // Get control points transformed to canvas coordinates
    const controlPoints = curve.points.map((point: any) => {
      return {
        x: transformedPosition.x + point.x * this.scale,
        y: transformedPosition.y - point.y * this.scale
      };
    });

    if (controlPoints.length >= 2) {
      this.ctx.beginPath();
      
      // Draw a single Bezier curve that passes through first and last points
      this.drawGeneralBezierCurve(controlPoints);
      
      this.ctx.stroke();
    }
    
    // Draw the control polygon only if curve is active (being edited)
    if (isActive && controlPoints.length >= 2) {
      this.ctx.beginPath();
      this.ctx.moveTo(controlPoints[0].x, controlPoints[0].y);
      for (let i = 1; i < controlPoints.length; i++) {
        this.ctx.lineTo(controlPoints[i].x, controlPoints[i].y);
      }
      this.ctx.strokeStyle = 'rgba(150, 150, 150, 0.5)';
      this.ctx.lineWidth = 1;
      this.ctx.setLineDash([5, 3]);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }
    
    // Always draw first and last points
    if (controlPoints.length > 0) {
      // Draw the first point (start) - green
      const firstPoint = controlPoints[0];
      this.ctx.fillStyle = '#4CAF50';
      this.ctx.beginPath();
      this.ctx.arc(firstPoint.x, firstPoint.y, 6, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Draw the last point (end) - red
      if (controlPoints.length > 1) {
        const lastPoint = controlPoints[controlPoints.length - 1];
        this.ctx.fillStyle = '#F44336';
        this.ctx.beginPath();
        this.ctx.arc(lastPoint.x, lastPoint.y, 6, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
    
    // Draw middle control points only when editing
    if (isActive) {
      // Draw only the middle control points (not first or last)
      for (let i = 1; i < controlPoints.length - 1; i++) {
        const point = controlPoints[i];
        this.ctx.fillStyle = i === this.selectedPointIndex ? '#FF0000' : '#808080';
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }

  private drawGeneralBezierCurve(points: {x: number, y: number}[]): void {
    if (points.length < 2) return;
    
    // Start at the first point
    this.ctx.moveTo(points[0].x, points[0].y);
    
    // If only 2 points, draw a straight line
    if (points.length === 2) {
      this.ctx.lineTo(points[1].x, points[1].y);
      return;
    }
    
    // For more points, draw a smooth curve using De Casteljau algorithm
    const steps = 100; // Number of segments for a smooth curve
    
    for (let t = 0; t <= steps; t++) {
      const point = this.deCasteljau(points, t / steps);
      this.ctx.lineTo(point.x, point.y);
    }
  }

  // De Casteljau algorithm for calculating points on a Bezier curve of any degree
  private deCasteljau(points: {x: number, y: number}[], t: number): {x: number, y: number} {
    if (points.length === 1) {
      return points[0];
    }
    
    const newPoints = [];
    for (let i = 0; i < points.length - 1; i++) {
      newPoints.push({
        x: (1 - t) * points[i].x + t * points[i + 1].x,
        y: (1 - t) * points[i].y + t * points[i + 1].y
      });
    }
    
    return this.deCasteljau(newPoints, t);
  }

  // Check if mouse is over a control point and select it
  public checkPointSelection(event: MouseEvent): boolean {
    if (!this.activeCurve || !this.activeCurve.points) return false;
    
    const rect = this.canvasElement.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    const viewWidth = this.canvasElement.width;
    const viewHeight = this.canvasElement.height;
    const transformedPosition = this.currentPosition.transform(viewWidth, viewHeight, this.scale);
    
    // Check if mouse is over any control point
    for (let i = 0; i < this.activeCurve.points.length; i++) {
      const point = this.activeCurve.points[i];
      const canvasX = transformedPosition.x + point.x * this.scale;
      const canvasY = transformedPosition.y - point.y * this.scale;
      
      // Simple distance check (within 8 pixels of point center)
      const distance = Math.sqrt(
        Math.pow(mouseX - canvasX, 2) + 
        Math.pow(mouseY - canvasY, 2)
      );
      
      if (distance <= 8) {
        this.selectedPointIndex = i;
        return true;
      }
    }
    
    this.selectedPointIndex = -1;
    return false;
  }
  
  // Update selected point position during dragging
  private dragSelectedPoint(event: MouseEvent): void {
    if (!this.activeCurve || this.selectedPointIndex < 0) return;
    
    const rect = this.canvasElement.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    const viewWidth = this.canvasElement.width;
    const viewHeight = this.canvasElement.height;
    const transformedPosition = this.currentPosition.transform(viewWidth, viewHeight, this.scale);
    
    // Convert screen coordinates to world coordinates
    const worldX = (mouseX - transformedPosition.x) / this.scale;
    const worldY = (transformedPosition.y - mouseY) / this.scale;
    
    // Update the point's coordinates
    this.activeCurve.points[this.selectedPointIndex].x = Math.round(worldX * 100) / 100;
    this.activeCurve.points[this.selectedPointIndex].y = Math.round(worldY * 100) / 100;
    
    // Redraw the curve
    this.clearCanvas();
    this.draw();
    
    // Redraw all curves
    if (typeof (window as any).redrawAllCurves === 'function') {
      (window as any).redrawAllCurves();
    }
  }

  public drawCurvesList(curves: any[], activeCurveId: string | null): void {
    // Store the curves and active ID for later redrawing during canvas transformations
    this.curves = curves;
    this.activeId = activeCurveId;
    
    // Draw inactive curves first
    curves.forEach(curve => {
      if (curve.id !== activeCurveId) {
        this.drawBezierCurve(curve, false);
      }
    });
    
    // Draw active curve on top
    const activeCurve = curves.find(curve => curve.id === activeCurveId);
    if (activeCurve) {
      this.drawBezierCurve(activeCurve, true);
      this.activeCurve = activeCurve;
    } else {
      this.activeCurve = null;
      this.selectedPointIndex = -1;  // Reset point selection when no active curve
    }
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
  
  public clearCanvas(forceFullRedraw: boolean = false): void {
    this.ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    
    if (forceFullRedraw) {
      // Reset the active curve state completely
      this.activeCurve = null;
      this.activeId = null;
      this.selectedPointIndex = -1;
    }
    
    this.draw();
  }

  public wasDraggingRecently(): boolean {
    // Check if we were actually dragging (moved a minimum distance) within the last 200ms
    return this._wasDragging && (Date.now() - this._dragEndTime < 200);
  }
  
  public resetDragState(): void {
    this._wasDragging = false;
  }

  
  public drawSinglePoint(point: {x: number, y: number}, color: string): void {
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
    this.ctx.arc(screenX, screenY, 6, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Draw a border around the point for better visibility
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  }

  /**
   * Draws a point at a specific t value on the curve and shows construction lines
   * @param curve The curve to calculate the point on
   * @param t The parameter value (0-1) along the curve
   */
  public drawPointAtT(curve: any, t: number): void {
    if (!curve || !curve.points || curve.points.length < 2) return;
    
    const viewWidth = this.canvasElement.width;
    const viewHeight = this.canvasElement.height;
    const transformedPosition = this.currentPosition.transform(viewWidth, viewHeight, this.scale);
    
    // Transform points to screen coordinates
    const controlPoints = curve.points.map((point: any) => {
      return {
        x: transformedPosition.x + point.x * this.scale,
        y: transformedPosition.y - point.y * this.scale
      };
    });
    
    // Calculate all intermediate points for visualization
    const allLevels = this.calculateDeCasteljauLevels(controlPoints, t);
    
    // Draw construction lines between the points
    this.drawConstructionLines(allLevels);
    
    // Get final point (the point on the curve at parameter t)
    const pointAtT = allLevels[allLevels.length - 1][0];
    
    // Draw a line from the curve to the X axis (optional)
    this.ctx.beginPath();
    this.ctx.setLineDash([3, 3]);
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.lineWidth = 1;
    this.ctx.moveTo(pointAtT.x, pointAtT.y);
    
    // Find closest point on X axis
    const xAxisY = transformedPosition.y;
    this.ctx.lineTo(pointAtT.x, xAxisY);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
    
    // Draw the marker point
    this.ctx.fillStyle = '#FF9800';
    this.ctx.beginPath();
    this.ctx.arc(pointAtT.x, pointAtT.y, 8, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Add a contrasting border for better visibility
    this.ctx.strokeStyle = 'white';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    
    // Optionally, add a label with the t value
    this.ctx.font = '12px Arial';
    this.ctx.fillStyle = '#000';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`t=${t.toFixed(2)}`, pointAtT.x, pointAtT.y - 15);
  }

  /**
   * Calculate all intermediate points for the de Casteljau algorithm
   */
  private calculateDeCasteljauLevels(points: {x: number, y: number}[], t: number): {x: number, y: number}[][] {
    const levels: {x: number, y: number}[][] = [];
    levels.push([...points]); // First level is the original points
    
    let currentLevel = points;
    while (currentLevel.length > 1) {
      const nextLevel = [];
      for (let i = 0; i < currentLevel.length - 1; i++) {
        const p0 = currentLevel[i];
        const p1 = currentLevel[i + 1];
        nextLevel.push({
          x: (1 - t) * p0.x + t * p1.x,
          y: (1 - t) * p0.y + t * p1.y
        });
      }
      levels.push(nextLevel);
      currentLevel = nextLevel;
    }
    
    return levels;
  }

  /**
   * Draw construction lines connecting intermediate points
   */
  private drawConstructionLines(levels: {x: number, y: number}[][]): void {
    const colorsByLevel = [
      'rgba(128, 128, 128, 0.7)', // Gray for first level (control polygon)
      'rgba(255, 0, 0, 0.7)',     // Red
      'rgba(0, 128, 0, 0.7)',     // Green
      'rgba(0, 0, 255, 0.7)',     // Blue
      'rgba(128, 0, 128, 0.7)'    // Purple (for higher orders)
    ];
    
    // Draw lines for each level
    for (let levelIndex = 0; levelIndex < levels.length; levelIndex++) {
      const level = levels[levelIndex];
      if (level.length < 2) continue; // Need at least 2 points to draw a line
      
      const color = colorsByLevel[Math.min(levelIndex, colorsByLevel.length - 1)];
      
      // Draw lines connecting points at this level
      this.ctx.beginPath();
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 2;
      
      if (levelIndex === 0) {
        // First level is the control polygon - draw dashed
        this.ctx.setLineDash([5, 3]);
      } else {
        // Other levels - draw solid but semi-transparent
        this.ctx.setLineDash([]);
      }
      
      // Draw the line connecting the points
      this.ctx.moveTo(level[0].x, level[0].y);
      for (let i = 1; i < level.length; i++) {
        this.ctx.lineTo(level[i].x, level[i].y);
      }
      this.ctx.stroke();
      
      // Draw points for each level
      level.forEach((point, pointIndex) => {
        // Skip drawing the point for the highest level (it's the point on the curve)
        // and for the intermediate points at level 0 (they're already drawn)
        if (levelIndex === levels.length - 1 || (levelIndex === 0 && pointIndex !== 0 && pointIndex !== level.length - 1)) {
          return;
        }
        
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        // Make the intermediate points smaller
        const radius = levelIndex === 0 ? 5 : 4;
        this.ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Add a thin black border for better visibility
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
      });
    }
    this.ctx.setLineDash([]); // Reset dash pattern
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
export class CanvasCurveService {
  private controllerInstance: CanvasCurveController | null = null;
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
      
      this.controllerInstance = new CanvasCurveController(canvas);
      
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

  private handleMouseDown(e: MouseEvent): void {
    if (this.controllerInstance) {
      this.controllerInstance['onDragStart'](e);
    }
  }

  private handleMouseMove(e: MouseEvent): void {
    if (this.controllerInstance) {
      this.controllerInstance['onDragMove'](e);
    }
  }

  private handleMouseUp(): void {
    if (this.controllerInstance) {
      this.controllerInstance['onDragEnd']();
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

  public drawCurvesList(curves: any[], activeCurveId: string | null): void {
    if (this.controllerInstance) {
      this.controllerInstance.drawCurvesList(curves, activeCurveId);
    }
  }
  
  public handleCanvasClick(event: MouseEvent): {x: number, y: number} | null {
    if (this.controllerInstance) {
      return this.controllerInstance.handleCanvasClick(event);
    }
    return null;
  }
  
  public clearCanvas(forceFullRedraw: boolean = false): void {
    if (this.controllerInstance) {
      this.controllerInstance.clearCanvas(forceFullRedraw);
    }
  }
  public isPointClicked(event: MouseEvent): boolean {
    if (this.controllerInstance) {
      return this.controllerInstance.checkPointSelection(event);
    }
    return false;
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

 
drawSinglePoint(point: {x: number, y: number}, color: string): void {
  if (this.controllerInstance) {
    this.controllerInstance.drawSinglePoint(point, color);
  }
}

public drawPointAtT(curve: any, t: number): void {
  if (this.controllerInstance) {
    this.controllerInstance.drawPointAtT(curve, t);
  }
}
}
