import { TestBed } from '@angular/core/testing';

import { P2poolService } from './p2pool.service';

describe('P2poolService', () => {
  let service: P2poolService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(P2poolService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
