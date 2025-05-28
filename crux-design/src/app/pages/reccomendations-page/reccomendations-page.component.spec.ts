import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReccomendationsPageComponent } from './reccomendations-page.component';

describe('ReccomendationsPageComponent', () => {
  let component: ReccomendationsPageComponent;
  let fixture: ComponentFixture<ReccomendationsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReccomendationsPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReccomendationsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
