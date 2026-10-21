import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RepsPage } from './reps.page';

const routes: Routes = [
  {
    path: '',
    component: RepsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RepsPageRoutingModule {}
