import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CampoDetailPageRoutingModule } from './campo-detail-routing.module';

import { CampoDetailPage } from './campo-detail.page';
import { VistoriaModalComponent } from './campo-detail.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CampoDetailPageRoutingModule
  ],
  declarations: [CampoDetailPage, VistoriaModalComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class CampoDetailPageModule {}