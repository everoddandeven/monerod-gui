import { TestBed } from '@angular/core/testing';

import { XmrigService } from './xmrig.service';

describe('XmrigService', () => {
  let service: XmrigService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(XmrigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
