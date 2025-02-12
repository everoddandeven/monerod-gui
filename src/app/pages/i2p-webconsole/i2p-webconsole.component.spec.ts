import { ComponentFixture, TestBed } from '@angular/core/testing';

import { I2pWebconsoleComponent } from './i2p-webconsole.component';

describe('I2pWebconsoleComponent', () => {
  let component: I2pWebconsoleComponent;
  let fixture: ComponentFixture<I2pWebconsoleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [I2pWebconsoleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(I2pWebconsoleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
