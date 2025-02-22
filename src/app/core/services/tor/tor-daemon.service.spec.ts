import { TestBed } from '@angular/core/testing';

import { TorDaemonService } from './tor-daemon.service';

describe('TorDaemonService', () => {
  let service: TorDaemonService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TorDaemonService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
