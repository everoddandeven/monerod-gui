import { TestBed } from '@angular/core/testing';

import { DaemonStatusService } from './daemon-status.service';

describe('DaemonStatusService', () => {
  let service: DaemonStatusService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DaemonStatusService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
