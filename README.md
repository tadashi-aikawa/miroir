# jumeaux-viewer

Viewer for [jumeaux](https://github.com/tadashi-aikawa/jumeaux).

Demo: https://tadashi-aikawa.github.io/jumeaux-viewer/

## Preparation for development

1. Install `yarn` globally if you are not installed

See https://yarnpkg.com/en/docs/install

2. Install `angular-cli` if you are not installed

```
$ yarn global add @angular/cli
```

3. Install dependencies

```
$ yarn install
```

## Development server

```
$ ng serve
```

Then access to `http://localhost:4200/`

## Production build

```
$ ng build --prod --base-href ${BASE_URL}
```

You have to specify BASE_URL as your own.
Ex. https://xxxxx/jumeaux-viewer/

## Deploy

You have to deploy `dist/*` to web server you want.
