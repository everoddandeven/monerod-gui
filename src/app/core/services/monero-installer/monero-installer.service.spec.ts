import { TestBed } from '@angular/core/testing';

import { MoneroInstallerService } from './monero-installer.service';

describe('MoneroInstallerService', () => {
  let service: MoneroInstallerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MoneroInstallerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
