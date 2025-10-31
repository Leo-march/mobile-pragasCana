import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CampoDetailPage } from './campo-detail.page';

const routes: Routes = [
  {
    path: '',
    component: CampoDetailPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CampoDetailPageRoutingModule {}
