import {Component} from '@angular/core';
import {animate, style, transition, trigger} from '@angular/animations';

@Component({
    selector: 'app-logo-loading',
    animations: [
        trigger(
            'feed',
            [
                transition(':enter', [
                    style({opacity: 0}),
                    animate('300ms', style({opacity: 1}))
                ]),
                transition(':leave', [
                    style({opacity: 1}),
                    animate('300ms', style({opacity: 0}))
                ])
            ]
        )
    ],
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
                -webkit-animation-delay: 0.3s;
            }

            .frame {
                width: 100%;
                height: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 100;
                position: absolute;
                background-color: rgba(255, 255, 255, 0.85);
            }
        </style>
        <div class="frame">
            <div class="center-horizontal blink" [@feed]>
                <img src="assets/jumeaux.png" style="width: 50%; height: 50%;" />
                <p style="font-size: 150%"><b>Now Loading...</b></p>
                <md-progress-bar mode="indeterminate"></md-progress-bar>
            </div>
        </div>
    `
})
export class LogoLoadingComponent {
}
