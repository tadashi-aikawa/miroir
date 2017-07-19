# jumeaux-viewer

<img src="./src/assets/jumeaux.png" width="500" height="500">

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
$ yarn start
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

## Dependencies without package.json

```
"monaco-editor": "^0.8.3",
```

Migrate to `package.json` when following issue is closed.

[Support for module\.js or commonjs? · Issue \#40 · Microsoft/monaco\-editor](https://github.com/Microsoft/monaco-editor/issues/40)

## Jumeaux Viewer in your hands!

Only you need to exec one command if you installed Vagrant and VirtualBox!

```
$ vagrant up --provision
```

And you can access to http://localhost:8888.

Note: I confirmed it with the following versions

* Vagrant: 1.9.5
* VirtualBox: 5.1.22 r115126

