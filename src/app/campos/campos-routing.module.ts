import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CamposPage } from './campos.page';

const routes: Routes = [
  {
    path: '',
    component: CamposPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CamposPageRoutingModule {}
