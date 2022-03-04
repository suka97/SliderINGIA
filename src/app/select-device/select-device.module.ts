import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SelectDevicePageRoutingModule } from './select-device-routing.module';

import { SelectDevicePage } from './select-device.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SelectDevicePageRoutingModule
  ],
  declarations: [SelectDevicePage]
})
export class SelectDevicePageModule {}
