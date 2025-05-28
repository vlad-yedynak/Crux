import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SandboxCardAnimationComponent } from './sandbox-card-animation.component';

describe('SandboxCardAnimationsComponent', () => {
  let component: SandboxCardAnimationComponent;
  let fixture: ComponentFixture<SandboxCardAnimationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SandboxCardAnimationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SandboxCardAnimationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
