import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TourPage } from './tour.page';

describe('TourPage', () => {
  let component: TourPage;
  let fixture: ComponentFixture<TourPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TourPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
