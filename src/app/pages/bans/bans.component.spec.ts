import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BansComponent } from './bans.component';

describe('BansComponent', () => {
  let component: BansComponent;
  let fixture: ComponentFixture<BansComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BansComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BansComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
