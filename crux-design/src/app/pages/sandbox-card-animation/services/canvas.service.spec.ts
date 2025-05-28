import { TestBed } from '@angular/core/testing';

import { CanvasService } from './canvas.service';

describe('CanvasServiceTsService', () => {
  let service: CanvasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CanvasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
