import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DaemonNotRunningComponent } from './daemon-not-running.component';

describe('DaemonNotRunningComponent', () => {
  let component: DaemonNotRunningComponent;
  let fixture: ComponentFixture<DaemonNotRunningComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DaemonNotRunningComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DaemonNotRunningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
