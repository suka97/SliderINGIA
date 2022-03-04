import { TestBed } from '@angular/core/testing';

import { MyNavServiceService } from './my-nav-service.service';

describe('MyNavServiceService', () => {
  let service: MyNavServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MyNavServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
