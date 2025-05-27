import { TestBed } from '@angular/core/testing';

import { CanvasCurveService } from './canvas-curve.service';

describe('CanvasCurveService', () => {
  let service: CanvasCurveService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CanvasCurveService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
