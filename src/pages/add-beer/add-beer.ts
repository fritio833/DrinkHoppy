import { Component } from '@angular/core';
import { NavController, NavParams, ViewController, AlertController } from 'ionic-angular';
import { Validators, FormBuilder } from '@angular/forms';

import { ValidationService } from '../../providers/validation-service';
import { BreweryService } from '../../providers/brewery-service';

@Component({
  selector: 'page-add-beer',
  templateUrl: 'add-beer.html'
})
export class AddBeerPage {

  public description:string;
  public beerForm:any;
  public breweryName:string;
  public glassware:any;
  public beerStyles:any;
  public beerAvailability:any;
  public beerSRM:any;
  public beerTemp:any;
  public breweryId:string;
  public formSubmittedSuccess:boolean = false;
  public noBreweryIncluded:boolean = false;
  public brewerySearch = [];
  public beerName:string = null;
  public breweryFound:number = -1;

  constructor(public navCtrl: NavController, 
              public params: NavParams,
              public form: FormBuilder,
              public beerAPI: BreweryService,
              public alertCtrl: AlertController,
              public view: ViewController) {

  	this.beerForm = this.form.group({
  	  style : ['',Validators.compose([Validators.required])],
      beerDescription : ['',Validators.compose([Validators.maxLength(1500)])],
      abv : ['',Validators.compose([Validators.pattern('[0-9\.]*')])],
      ibu : ['',Validators.compose([Validators.pattern('[0-9]*')])],
      srm : [''],
      gravity : ['',Validators.compose([Validators.pattern('[0-9\.]*')])],
      available : [''],
      glassware : [''],
      organic : [''],           
  	  name : ['',Validators.compose([Validators.required,Validators.maxLength(100)])]
  	});

    this.breweryName = params.get('locName');
    this.breweryId = params.get('breweryId');
    this.beerName = params.get('beerName');

    if (this.beerName != null) {
      this.beerForm.controls['name'].setValue(this.beerName);
    }

    if (this.breweryId == null) {
      this.noBreweryIncluded = true;
    }
  }

  addBeer() {

    let beerFormVals = {};

    if (this.beerForm.valid) {

      beerFormVals = {
        brewery:this.breweryId,
        abv:this.beerForm.controls.abv.value,
        availableId:this.beerForm.controls.available.value,
        description:this.beerForm.controls.beerDescription.value,
        glasswareId:this.beerForm.controls.glassware.value,
        originalGravity:this.beerForm.controls.gravity.value,
        ibu:this.beerForm.controls.ibu.value,
        name:this.beerForm.controls.name.value,
        isOrganic:this.beerForm.controls.organic.value,
        srmId:this.beerForm.controls.srm.value,
        styleId:this.beerForm.controls.style.value
      };

      //console.log('form',beerFormVals);
      this.beerAPI.postNewBeer(beerFormVals).subscribe(resp=>{
          this.formSubmittedSuccess = true;
          console.log('resp',resp);
      },error=>{
        console.log('error beerAPI.postNewBeer',error);
        this.promptAlert('Problems submitting.  Please try again.');
      });

       
    } else {
      if (this.beerForm.controls.style.invalid || this.beerForm.controls.name.invalid) {
        this.promptAlert('Beer Name and Style are required.');
      } else {
        this.promptAlert('Fix the inputs marked by the red line.');
      }
    }
  }

  cancel() {
    this.view.dismiss();
  }

  addAnother() {
    this.formSubmittedSuccess = false;
    this.beerForm.reset();
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad AddBeerPage');

      this.beerAPI.loadBeerGlassware().subscribe(glass=>{
        this.glassware = glass.data;
        //console.log(this.glassware);
      },error=>{
        console.log('error loadBeerGlassware',error);
      });

    this.beerAPI.loadMenuStyles().subscribe((styles)=>{
      this.beerStyles = styles.data;
      this.beerStyles.sort(this.SORT_BEER_STYLE);
      //console.log('beer styles',this.beerStyles);
    },error=>{
      console.log('error loadMenuStyles',error);
    });

    this.beerAPI.loadMenuAvailability().subscribe((avail)=>{
      this.beerAvailability = avail.data;
    },error=>{
      console.log('error loadMenuAvailability',error);
    });

    this.beerAPI.loadMenuSRM().subscribe((srm)=>{
      this.beerSRM = srm.data;
    },error=>{
      console.log('error loadMenuSRM',error);
    }); 
  }

  SORT_BEER_STYLE(a,b) {

    if (a.shortName < b.shortName)
      return -1;
    if (a.shortName > b.shortName)
      return 1;
    return 0;
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

  setBrewery(result) {
    this.noBreweryIncluded = false;
    this.breweryId = result.id;
    this.breweryName = result.name;
  }

  doSearchBrewery(event){
    if (event.type == "input" && event.target.value.length) {
      //this.qBreweryAuto = event.target.value;
      this.beerAPI.findBreweriesByName(event.target.value).subscribe((success)=>{
        console.log('brewery',success);

        if ( success.totalResults ) {
          this.brewerySearch = success.data;
          this.breweryFound = 1;
        } else {
          this.brewerySearch = [];
          this.breweryFound = 0;
        }
      },error=>{
        console.log('error findBreweriesByName',error);
        //this.presentToast('Could not connect. Check connection.');
      });
    }
  }   

}
