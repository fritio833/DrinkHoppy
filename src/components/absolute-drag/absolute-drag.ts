import { Directive, Input, ElementRef, Renderer } from '@angular/core';
import { DomController } from 'ionic-angular';


@Directive({
  selector: '[absolute-drag]' // Attribute selector
})
export class AbsoluteDrag {

    @Input('startLeft') startLeft: any;
    @Input('startTop') startTop: any;
 
    constructor(public element: ElementRef, public renderer: Renderer, public domCtrl: DomController) {
 
    }
 
    ngAfterViewInit() {
 
        this.renderer.setElementStyle(this.element.nativeElement, 'position', 'absolute');
        this.renderer.setElementStyle(this.element.nativeElement, 'left', this.startLeft + 'px');
        this.renderer.setElementStyle(this.element.nativeElement, 'top', this.startTop + 'px');
 
        let hammer = new window['Hammer'](this.element.nativeElement);
        hammer.get('pan').set({ direction: window['Hammer'].DIRECTION_ALL });
 
        hammer.on('pan', (ev) => {
          this.handlePan(ev);
          console.log(ev);
        });
 
    }
 
    handlePan(ev){

      var posX = 0,
          posY = 0,
          scale = 1,
          last_scale = 1,
          last_posX = 0,
          last_posY = 0,
          max_pos_x = 0,
          max_pos_y = 0,
          transform = "";
          //console.log('ev.clientWidth', ev.clientWidth);
          //console.log('ev.clientHeight', ev.clientHeight);
          //let newLeft = ev.center.x - (ev.target.width / 2);
          //let newTop = ev.center.y - (ev.target.height / 2);
            posX = last_posX + ev.deltaX;
            posY = last_posY + ev.deltaY;
            //max_pos_x = Math.ceil((scale - 1) * ev.target.clientWidth / 2);
            //max_pos_y = Math.ceil((scale - 1) * ev.target.clientHeight / 2);
            max_pos_x = (ev.target.clientWidth / 2);
            max_pos_y = (ev.target.clientHeight / 2);
            if (posX > max_pos_x) {
                posX = max_pos_x;
            }
            if (posX < -max_pos_x) {
                posX = -max_pos_x;
            }
            if (posY > max_pos_y) {
                posY = max_pos_y;
            }
            if (posY < -max_pos_y) {
                posY = -max_pos_y;
            }
      

        this.domCtrl.write(() => {
            this.renderer.setElementStyle(this.element.nativeElement, 'left', posX + 'px');
            this.renderer.setElementStyle(this.element.nativeElement, 'top', posY + 'px');
        });
 
    }

}
