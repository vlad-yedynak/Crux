import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SandboxCardFractalComponent } from './sandbox-card-fractal.component';

describe('SandboxCardFractalComponent', () => {
  let component: SandboxCardFractalComponent;
  let fixture: ComponentFixture<SandboxCardFractalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SandboxCardFractalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SandboxCardFractalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
