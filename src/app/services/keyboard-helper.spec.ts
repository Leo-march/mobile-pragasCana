import { TestBed } from '@angular/core/testing';

import { KeyboardHelper } from './keyboard-helper';

describe('KeyboardHelper', () => {
  let service: KeyboardHelper;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KeyboardHelper);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
