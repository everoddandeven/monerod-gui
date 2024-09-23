import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HardForkInfoComponent } from './hard-fork-info.component';

describe('HardForkInfoComponent', () => {
  let component: HardForkInfoComponent;
  let fixture: ComponentFixture<HardForkInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HardForkInfoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HardForkInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
