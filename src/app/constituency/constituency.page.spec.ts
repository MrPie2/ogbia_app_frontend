import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConstituencyPage } from './constituency.page';

describe('ConstituencyPage', () => {
  let component: ConstituencyPage;
  let fixture: ComponentFixture<ConstituencyPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ConstituencyPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
