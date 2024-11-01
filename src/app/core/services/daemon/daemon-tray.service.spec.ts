import { TestBed } from '@angular/core/testing';

import { DaemonTrayService } from './daemon-tray.service';

describe('DaemonTrayService', () => {
  let service: DaemonTrayService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DaemonTrayService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
