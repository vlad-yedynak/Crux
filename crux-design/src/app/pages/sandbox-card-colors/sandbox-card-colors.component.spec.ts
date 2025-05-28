import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SandboxCardColorsComponent } from './sandbox-card-colors.component';

describe('SandboxCardColorsComponent', () => {
  let component: SandboxCardColorsComponent;
  let fixture: ComponentFixture<SandboxCardColorsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SandboxCardColorsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SandboxCardColorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
