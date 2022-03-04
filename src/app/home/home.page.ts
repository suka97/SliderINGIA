import { Component, NgZone } from '@angular/core';
import { BluetoothSerial } from '@awesome-cordova-plugins/bluetooth-serial/ngx';
import { IonButton, ToastController, LoadingController, NavController } from "@ionic/angular";
import { NavigationExtras } from '@angular/router';
import { MyNavServiceService } from '../my-nav-service.service';


interface BufferRxType {
    sent:string;
    timer;
    resolve;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  constructor(private myNavService: MyNavServiceService, private bluetoothSerial: BluetoothSerial, 
    public navCtrl: NavController, public toastController: ToastController, private zone: NgZone,
    public loadingController: LoadingController) {}

  debugObjArray(objArray) {
    let debugArray = [];
    objArray.forEach((i)=>{
      let element = [];
      Object.keys(i).forEach((key)=>{
        element.push(key+': '+i[key]);
      });
      debugArray.push(element);
    });
    console.log(debugArray);
  }

  ngOnInit() {
    this.myNavService.get_SelectDevice2Home().subscribe((device)=>{
      this.connectToDevice(device);
    })
    this.myNavService.get_BackFromSettings().subscribe(()=>{
      this.writeSettings();
    });
    this.bluetoothSerial.subscribe('$').subscribe((data)=>{
      console.log('rx: '+data);
      // this.debugObjArray(this.bufferRx);
      var buffer = this.bufferRx.shift();
      clearTimeout(buffer.timer);
      buffer.resolve(data.slice(0,-1));
    });
  }

  bufferRx: BufferRxType[] = [];
  buttons = {
    connect: {
      text: 'CONECTAR',
      color: 'primary'
    },
    home: {
      color: 'primary'
    },
    jog_up: {
      color: 'primary'
    },
    jog_down: {
      color: 'primary'
    },
    mover: {
      color: 'primary',
      text: 'MOVER'
    },
    stop: {
      disabled: true
    }
  };
  settings = {
    rel_num: { dir:5, val:0 },
    rel_den: { dir:6, val:0 },  // importante que rel esten arriba para que primereen
    vel_subida: { dir:0, val:0 },
    acel: { dir:1, val:0 },
    offset: { dir:2, val:0 },
    vel_bajada: { dir:3, val:0 },
    vel_home: { dir:4, val:0 },
  };
  but_disabled: boolean = true;
  vel_jog: number = 2;
  motor_pos: number = 0;
  motor_target: number = 0;
  currentEstado: string;
  isLoading: boolean = false;
  last_connected_device: string = '';


  settingsClicked() {
    console.log(this.settings);
    let navigationExtras: NavigationExtras = {
      queryParams: this.settings
    };
    this.navCtrl.navigateForward("settings", navigationExtras);
  }

  handleEstado(estado:string) {
    this.buttons.mover.color = 'primary';
    this.buttons.home.color = 'primary';
    this.buttons.jog_up.color = 'primary';
    this.buttons.jog_down.color = 'primary';
    switch(estado) {
      case '1': {   // HOMING
        this.buttons.home.color = 'medium';
        this.currentEstado = 'homing';
        break;
      }
      case '2': { // ESPERANDO
        this.currentEstado = 'esperando';
        this.but_disabled = false;
        break;
      }
      case '3': { // MOVIENDO
        this.buttons.mover.color = 'medium';
        this.currentEstado = 'moviendo';
        break;
      }
    }
  }

  initialQuery(): Promise<any> {
    var promise = new Promise((resolve, reject)=> {
      this.sendCommand('A-1').then( // pregunto ESTADO_CICLO
        (resp)=>{
          this.handleEstado(resp);
          this.sendCommand('A-2').then( // pregunto pos_actual
            (pos)=>{
              this.motor_pos = Math.round(pos / this.settings.rel_num.val/this.settings.rel_den.val);
              this.askSettings();
              resolve('OK');
            },
            (error)=>{ reject('POS_ACTUAL') }
          );
        },
        (error)=>{ reject('ESTADO_CICLO') }
      );
    });
    return promise;
  }

  connectToDevice(device) {
    this.presentLoading('Conectando...');
    console.log('conectando...');
    this.bluetoothSerial.connect(device.address).subscribe(
      (res) => { // res devolvio 'OK'
        this.initialQuery().then( 
          (resp)=>{
            this.dismissLoading();
            this.buttons.stop.disabled = false;
            this.buttons.connect.text = 'DESCONECTAR';
            this.buttons.connect.color = "danger";
            console.log('BL Ok: '+res);
            this.toast("Dispositivo conectado");
            this.last_connected_device = device;
            this.askPosUntilEstado('2');
          },
          (error)=>{
            this.dismissLoading();
            this.disconnectError('BL Error: Response');
            this.last_connected_device = '';
          }
        )
      },
      (res) => {  // error
        this.dismissLoading();
        this.disconnectError('BL Error: '+res);
      }
    );
  }

  connectClicked() {
    var bluetoothSerial = this.bluetoothSerial;
    bluetoothSerial.isEnabled().then(
      ()=> {  // bluetooth habilitado
        bluetoothSerial.isConnected().then(
          ()=> {  // desconectar dispositivo
            bluetoothSerial.disconnect().then(()=>{
              this.buttons.connect.text = "CONECTAR";
              this.buttons.connect.color = "primary";
              this.toast("Dispositivo desconectado");
              this.but_disabled = true;
              this.buttons.stop.disabled = true;
            });
          },
          ()=> {  // conectar dispositivo
            if( this.last_connected_device == '' ) {
              bluetoothSerial.list().then( (devices)=> {
                let navigationExtras: NavigationExtras = {
                  queryParams: { list: devices }
                };
                this.navCtrl.navigateForward("select-device", navigationExtras);
              });
            }
            else {
              this.connectToDevice(this.last_connected_device);
            }
          }
        );
      },
      ()=> {  // bluetooth deshabilitado
        console.log('bluetooth deshabilitado');
        bluetoothSerial.enable().then( ()=> {
          this.connectClicked();
        });
      }
    );
  }

  sendCommand(input: string): Promise<any> {
    var promise = new Promise((resolve, reject)=> {
      let command = input + '$';
      console.log('tx: '+command);
      this.bufferRx.push({
        sent: command,
        timer: setTimeout(()=>{
          this.bufferRx.shift();
          this.toast('Timeout envio');
          console.log('Timeout envio');
          reject('timeout');
        },5000),
        resolve: resolve
      });
      this.bluetoothSerial.write(command).then(
        ()=> { }, // comando enviado
        ()=> {
          console.log('Error envio');
          reject('error_envio')
        }
      )
    });
    return promise;
  }

  commandHome() {
    this.sendCommand('H').then(
      (resp)=>{
        this.but_disabled = true;
        this.currentEstado = 'homing';
        this.buttons.home.color = 'medium';
        this.askPosUntilEstado('2');
      },
      (error)=>{
        this.disconnectError(error);
      }
    );
  }

  commandMover() {
    let target = Math.round(this.motor_target*this.settings.rel_num.val/this.settings.rel_den.val)
    this.sendCommand('M'+target).then(
      (resp)=>{
        this.but_disabled = true;
        this.currentEstado = 'moviendo';
        this.buttons.mover.color = 'medium';   
        this.askPosUntilEstado('2');
      },
      (error)=>{
        this.disconnectError(error);
      }
    );
  }

  askPosUntilEstado(finalEstado:string) {
    setTimeout(()=>{
      this.sendCommand('A-1').then( // estado
        (resp)=>{
          this.handleEstado(resp);
          if( resp != finalEstado ) this.askPosUntilEstado(finalEstado);
          this.sendCommand('A-2').then((pos)=>{  // pos
            this.motor_pos = Math.round(pos / this.settings.rel_num.val/this.settings.rel_den.val);
          });
        },
        (error)=>{
          this.disconnectError(error);
        }
      );
    }, 500);
  }

  commandJog(dir) { // 1=▲ ; -1=▼
    let vel = Math.round(this.vel_jog*dir * this.settings.rel_num.val/this.settings.rel_den.val);
    this.sendCommand('J'+(vel)).then(
      (resp)=>{
        // this.but_disabled = true;
        if ( dir > 0 ) this.buttons.jog_up.color = 'medium';
        else this.buttons.jog_down.color = 'medium';
        this.askPosUntilEstado('2');
      },
      (error)=>{
        this.disconnectError(error);
      }
    );
  }

  commandStop() {
    this.sendCommand('S').then(
      (resp)=>{
        this.sendCommand('A-1').then(
          (estado)=>{
            this.handleEstado(estado);
          },
          (error)=>{
            this.disconnectError(error);
          }
        );
      },
      (error)=>{
        this.disconnectError(error);
      }
    );
  }

  askSettings() {
    Object.keys(this.settings).forEach(i=>{
      this.sendCommand('A'+this.settings[i].dir).then(
        (resp)=>{ 
          if ( ['vel_subida','vel_bajada','vel_home','offset','acel'].includes(i) )
            this.settings[i].val = Math.round(resp/(this.settings.rel_num.val/this.settings.rel_den.val));
          else
            this.settings[i].val = resp;
        },
        (error)=>{
          this.disconnectError(error);
        }
      )
    });
  }

  writeSettings() {
    let keys = Object.keys(this.settings);
    for(let j=0 ; j<keys.length ; j++ ) {
      let i = keys[j];
      let val = this.settings[i].val;
      if ( ['vel_subida','vel_bajada','vel_home','offset','acel'].includes(i) )
        val = Math.round(val*(this.settings.rel_num.val/this.settings.rel_den.val));
      console.log({key: i, valor: val});
      setTimeout(()=>{  // si no le pongo espacio en cada uno se cagaba el socket bluetooth
        this.sendCommand('C'+this.settings[i].dir+','+val).then(
          (resp)=>{ },
          (error)=>{
            this.disconnectError(error);
          }
        );
      }, 50*j);
    }
  }

  disconnectError(message: string) {
    // limpio el bufferRx
    this.bufferRx.forEach((buffer)=>{
      clearTimeout(buffer.timer);
    });
    this.bufferRx = [];
    // desconecto bluetooth
    this.bluetoothSerial.disconnect().then(()=>{
      this.toast(message);
      console.log('disconnect: '+message);
      this.but_disabled = true;
      this.buttons.connect.color = 'primary';
      this.buttons.connect.text = 'CONECTAR';
      this.buttons.stop.disabled = true;
    });
  }

  homeClicked() {
    if( this.currentEstado == 'homing' ) this.commandStop();
    else this.commandHome();
  }

  moverClicked() {
    if( this.currentEstado == 'moviendo' ) this.commandStop();
    else this.commandMover();
  }

  async toast(message: string, duration: number = 2000) {
    const toast = await this.toastController.create({
      message: message,
      duration: duration
    });
    toast.present();
  }
  async presentLoading(message: string, duration: number = 30000) {
    this.isLoading = true;
    return await this.loadingController.create({
      message: message,
      duration: duration
    }).then(a => {
      a.present().then(() => {
        //console.log('presented');
        if (!this.isLoading) {
          a.dismiss()/*.then(() => console.log('abort presenting'))*/;
        }
      });
    });
  }
  async dismissLoading() {
    this.isLoading = false;
    return await this.loadingController.dismiss()/*.then(() => console.log('dismissed'))*/;
  }
}