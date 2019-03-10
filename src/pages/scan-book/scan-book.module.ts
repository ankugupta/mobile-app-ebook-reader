import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ScanBookPage } from './scan-book';

@NgModule({
  declarations: [
    ScanBookPage,
  ],
  imports: [
    IonicPageModule.forChild(ScanBookPage),
  ],
})
export class ScanBookPageModule {}
