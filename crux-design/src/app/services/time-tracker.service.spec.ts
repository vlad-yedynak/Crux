import { TestBed } from '@angular/core/testing';

import { TimeTrackerService } from './time-tracker.service';

describe('TimeTrackerService', () => {
  let service: TimeTrackerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TimeTrackerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
