import {Component} from '@angular/core';
import {animate, style, transition, trigger} from '@angular/animations';

@Component({
    selector: 'app-logo-loading',
    template: `
        <style>
            .frame {
                width: 100vw;
                height: 100vh;
                z-index: 100;
                position: fixed;
                background-color: rgba(255, 255, 255, 0.85);
            }
            .loading-image {
                max-height: 256px;
                padding-top: 20vh;
            }
            .loading-message {
                margin-top: 15px;
                margin-bottom: 15px;
                font-size: 200%;
                font-weight: bold;
                color: #3f51b5;
            }
            .loading-bar {
                max-width: 256px;
            }
            .shake {
                animation: shake .4s  infinite;
            }
            @keyframes shake {
                0% {transform: translate(0px, 0px) rotateZ(0deg)}
                25% {transform: translate(2px, 2px) rotateZ(1deg)}
                50% {transform: translate(0px, 2px) rotateZ(0deg)}
                75% {transform: translate(2px, 0px) rotateZ(-1deg)}
                100% {transform: translate(0px, 0px) rotateZ(0deg)}
            }
        </style>
        <div class="frame center-horizontal">
            <img src="assets/miroir.png" class="loading-image shake"/>
            <div class="loading-message shake">NOW LOADING</div>
            <mat-progress-bar mode="indeterminate" class="loading-bar"></mat-progress-bar>
        </div>
    `
})
export class LogoLoadingComponent {
}
