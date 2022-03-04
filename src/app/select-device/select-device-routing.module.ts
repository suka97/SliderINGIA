import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SelectDevicePage } from './select-device.page';

const routes: Routes = [
  {
    path: '',
    component: SelectDevicePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SelectDevicePageRoutingModule {}
