import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CampoDetailPage } from './campo-detail.page';

describe('CampoDetailPage', () => {
  let component: CampoDetailPage;
  let fixture: ComponentFixture<CampoDetailPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CampoDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
