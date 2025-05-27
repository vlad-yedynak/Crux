import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SandboxCardBezierComponent } from './sandbox-card-bezier.component';

describe('SandboxCardBezierComponent', () => {
  let component: SandboxCardBezierComponent;
  let fixture: ComponentFixture<SandboxCardBezierComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SandboxCardBezierComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SandboxCardBezierComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
