import { TestBed } from '@angular/core/testing';

import { I2pDaemonService } from './i2p-daemon.service';

describe('I2pDaemonService', () => {
  let service: I2pDaemonService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(I2pDaemonService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
