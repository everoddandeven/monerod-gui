import { TestBed } from '@angular/core/testing';

import { DaemonDataService } from './daemon-data.service';

describe('DaemonDataService', () => {
  let service: DaemonDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DaemonDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
