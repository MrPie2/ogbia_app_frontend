import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CdcPage } from './cdc.page';

describe('CdcPage', () => {
  let component: CdcPage;
  let fixture: ComponentFixture<CdcPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CdcPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
