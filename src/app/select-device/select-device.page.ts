import { Component, OnInit } from '@angular/core';
import { NavController } from "@ionic/angular";
import { MyNavServiceService } from '../my-nav-service.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-select-device',
  templateUrl: './select-device.page.html',
  styleUrls: ['./select-device.page.scss'],
})
export class SelectDevicePage implements OnInit {

  constructor(private myNavService: MyNavServiceService, private route: ActivatedRoute, public navCtrl: NavController) { }

  devices;  // { "name": "SelfieCom", "address": "FF:FF:77:00:DF:D7", "id": "FF:FF:77:00:DF:D7", "class": 1344 }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.devices = params.list;
    });
  }

  select(device) {
    this.myNavService.post_SelectDevice2Home(device);
    this.navCtrl.back();
  }

}
