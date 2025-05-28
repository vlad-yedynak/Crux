import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SandboxCardComponent } from './sandbox-card.component';

describe('SandboxCardComponent', () => {
  let component: SandboxCardComponent;
  let fixture: ComponentFixture<SandboxCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SandboxCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SandboxCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
