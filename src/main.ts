import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import * as HC from 'highcharts';
window['Highcharts'] = HC;

if (environment.production) {
  enableProdMode();
}

const onGotAmdLoader = () => {
  platformBrowserDynamic().bootstrapModule(AppModule);
};

if (!(<any>window).require) {
  const loaderScript = document.createElement('script');
  loaderScript.type = 'text/javascript';
  loaderScript.src = 'assets/monaco/vs/loader.js';
  loaderScript.addEventListener('load', onGotAmdLoader);
  document.body.appendChild(loaderScript);
} else {
  onGotAmdLoader();
}
