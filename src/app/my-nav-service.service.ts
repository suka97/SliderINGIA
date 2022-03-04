import { Injectable } from '@angular/core';
import { Subject } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class MyNavServiceService {

  constructor() { }

  subject_SelectDevice2Home = new Subject<any>();
  subject_BackFromSettings = new Subject<any>();

  post_BackFromSettings() {
    this.subject_BackFromSettings.next('back');
  }

  get_BackFromSettings(): Subject<any> {
    return this.subject_BackFromSettings;
  }

  post_SelectDevice2Home(device: any) {
      this.subject_SelectDevice2Home.next(device);
  }

  get_SelectDevice2Home(): Subject<any> {
      return this.subject_SelectDevice2Home;
  }
}
