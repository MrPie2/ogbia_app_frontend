import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CdcPage } from './cdc.page';

const routes: Routes = [
  {
    path: '',
    component: CdcPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CdcPageRoutingModule {}
