import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RepsPage } from './reps.page';

describe('RepsPage', () => {
  let component: RepsPage;
  let fixture: ComponentFixture<RepsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RepsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
