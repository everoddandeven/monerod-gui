import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TorControlComponent } from './tor-control.component';

describe('TorControlComponent', () => {
  let component: TorControlComponent;
  let fixture: ComponentFixture<TorControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TorControlComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TorControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
