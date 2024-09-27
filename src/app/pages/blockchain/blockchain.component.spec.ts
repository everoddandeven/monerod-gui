import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlockchainComponent } from './blockchain.component';

describe('BlockchainComponent', () => {
  let component: BlockchainComponent;
  let fixture: ComponentFixture<BlockchainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlockchainComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BlockchainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
