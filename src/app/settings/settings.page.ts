import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Platform, NavController } from '@ionic/angular';
import { MyNavServiceService } from '../my-nav-service.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {

  constructor(private myNavService: MyNavServiceService, private route: ActivatedRoute, private platform: Platform,
    public navCtrl: NavController) { 
    this.platform.backButton.subscribeWithPriority(10, () => {
      this.myNavService.post_BackFromSettings();
      navCtrl.back();
    });
  }
  
  settings: object;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.settings = params;
    });
  }

}
