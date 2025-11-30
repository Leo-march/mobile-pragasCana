import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CampoDetailPageRoutingModule } from './campo-detail-routing.module';

import { CampoDetailPage } from './campo-detail.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CampoDetailPageRoutingModule
  ],
  declarations: [CampoDetailPage]
})
export class CampoDetailPageModule {}