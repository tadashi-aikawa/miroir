import {Component} from '@angular/core';
import {animate, style, transition, trigger} from '@angular/animations';

@Component({
    selector: 'app-logo-loading',
    template: `
        <style>
            .frame {
                width: 100%;
                height: 100%;
                z-index: 100;
                position: fixed;
                background-color: rgba(255, 255, 255, 0.85);
            }
            .loading-image {
                width: auto;
                height: 75vh;
                max-height: 768px;
                top: 10vh;
                z-index: 200;
                position: fixed;
            }
        </style>
        <div class="frame center-horizontal">
            <img src="assets/jumeaux-loading.gif" class="loading-image"/>
        </div>
    `
})
export class LogoLoadingComponent {
}
