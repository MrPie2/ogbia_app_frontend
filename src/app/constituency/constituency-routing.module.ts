import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ConstituencyPage } from './constituency.page';

const routes: Routes = [
  {
    path: '',
    component: ConstituencyPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ConstituencyPageRoutingModule {}
