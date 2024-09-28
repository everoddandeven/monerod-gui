import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DaemonStoppingComponent } from './daemon-stopping.component';

describe('DaemonStoppingComponent', () => {
  let component: DaemonStoppingComponent;
  let fixture: ComponentFixture<DaemonStoppingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DaemonStoppingComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DaemonStoppingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
