import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CamposPage } from './campos.page';

describe('CamposPage', () => {
  let component: CamposPage;
  let fixture: ComponentFixture<CamposPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CamposPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
