import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LessonsPageComponent } from './lessons-page.component';

describe('LessonsPageComponent', () => {
  let component: LessonsPageComponent;
  let fixture: ComponentFixture<LessonsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LessonsPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LessonsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
