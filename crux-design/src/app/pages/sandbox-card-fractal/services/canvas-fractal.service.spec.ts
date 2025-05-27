import { TestBed } from '@angular/core/testing';

import { CanvasFractalService } from './canvas-fractal.service';

describe('CanvasFractalService', () => {
  let service: CanvasFractalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CanvasFractalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
