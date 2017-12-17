Miroir
======

<img src="./src/assets/miroir.png" width="240" height="240">

Viewer for [jumeaux](https://github.com/tadashi-aikawa/jumeaux).


Setup
-----

```
$ ./setup-aws.sh <bucket_name> <table_name>
```

`./setup-aws.sh -h` shows usages and a example.


Developer
---------

### Preparation for development

```
$ npm install
```

### Development server

```
$ npm run dev
```

Then access to `http://localhost:4200/`


### Production build

```
$ ng build --prod --base-href ${BASE_URL}
```

You have to specify BASE_URL as your own.
Ex. https://xxxxx/miroir/

### Deploy

You have to deploy `dist/*` to web server you want.

### Dependencies without package.json

```
"monaco-editor": "^0.8.3",
```

Migrate to `package.json` when following issue is closed.

[Support for module\.js or commonjs? · Issue \#40 · Microsoft/monaco\-editor](https://github.com/Microsoft/monaco-editor/issues/40)
