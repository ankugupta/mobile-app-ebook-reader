import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { MyBooksPage } from '../my-books/my-books';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  constructor(public nav: NavController) {
  }

  goToMyBooksPage() {
    this.nav.push(MyBooksPage);
  }

}
