import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CamposPageRoutingModule } from './campos-routing.module';

import { CamposPage } from './campos.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CamposPageRoutingModule
  ],
  declarations: [CamposPage]
})
export class CamposPageModule {}
