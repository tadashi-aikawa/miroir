import {Component} from '@angular/core';

@Component({
    selector: 'app-logo-loading',
    template: `
        <style>
            @-webkit-keyframes blink {
                from {
                    opacity: 1;
                }
                to {
                    opacity: 0.1;
                }
            }

            .blink {
                -webkit-animation-name: blink;
                -webkit-animation-duration: 0.65s;
                -webkit-animation-iteration-count:infinite;
                -webkit-animation-timing-function:ease-in-out;
                -webkit-animation-direction: alternate;
                -webkit-animation-delay: 0s;
            }

            .frame {
                width: 100%;
                height: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 100;
                position: absolute;
                color: white;
                background-color: rgba(0, 0, 0, 0.75);
            }
        </style>
        <div class="frame">
            <div class="center-horizontal blink">
                <img src="assets/jumeaux-white.png" style="width: 50%; height: 50%;" />
                <p style="font-size: 125%">Now Loading...</p>
                <md-progress-bar mode="indeterminate"></md-progress-bar>
            </div>
        </div>
    `
})
export class LogoLoadingComponent {
}
