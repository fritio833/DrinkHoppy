import { Component } from '@angular/core';
import { NavController, NavParams, ViewController, AlertController } from 'ionic-angular';
import { Validators, FormBuilder } from '@angular/forms';

import { BreweryService } from '../../providers/brewery-service';

@Component({
  selector: 'page-add-brewery',
  templateUrl: 'add-brewery.html'
})
export class AddBreweryPage {

  public breweryName:string;
  public formSubmittedSuccess:boolean = false;
  public breweryForm:any;  

  constructor(public navCtrl: NavController, 
              public params: NavParams,
              public form: FormBuilder,
              public alertCtrl: AlertController,
              public beerAPI: BreweryService,
              public view: ViewController) {
    this.breweryName = params.get('breweryName');

  	this.breweryForm = this.form.group({
      name : ['',Validators.compose([Validators.required,Validators.maxLength(100)])],
      description : ['',Validators.compose([Validators.maxLength(1500)])],
      website : [''],
      established : ['',Validators.compose([Validators.pattern('[0-9]*'),Validators.minLength(4),Validators.maxLength(4)])],
      isOrganic : ['']
  	});

    if (this.breweryName != null) {
      this.breweryForm.controls['name'].setValue(this.breweryName);
    }    
  }

  addAnother() {
    this.formSubmittedSuccess = false;
    this.breweryForm.reset();
  }  

  addBrewery() {

    let breweryFormVals = {};

    if (this.breweryForm.valid) {

      breweryFormVals = {
        name:this.breweryForm.controls.name.value,
        website:this.breweryForm.controls.website.value,
        description:this.breweryForm.controls.description.value,
        isOrganic:this.breweryForm.controls.isOrganic.value,
        established:this.breweryForm.controls.established.value
      };

      console.log('form',breweryFormVals);
      
      this.beerAPI.postNewBrewery(breweryFormVals).subscribe(resp=>{
          this.formSubmittedSuccess = true;
          console.log('resp',resp);
      },error=>{
        console.log('error beerAPI.postNewBeer',error);
        this.promptAlert('Problems submitting.  Please try again.');
      });      
       
    } else {
      if (this.breweryForm.controls.name.invalid) {
        this.promptAlert('Brewery name is required.');
      } else {
        this.promptAlert('Fix the inputs marked by the red line.');
      }
    }
    
  }

  promptAlert(msg) {
    let prompt = this.alertCtrl.create({
      title: 'Error',
      message: msg,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });
    prompt.present();
  }  

  cancel() {
    this.view.dismiss();
  }  

  ionViewDidLoad() {
    console.log('ionViewDidLoad AddBreweryPage');
  }

}
