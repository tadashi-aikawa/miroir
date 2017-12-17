Miroir
======

<img src="./src/assets/miroir.png" width="240" height="240">

Viewer for [jumeaux](https://github.com/tadashi-aikawa/jumeaux).


AWS Setup
---------

```
$ ./setup-aws.sh <bucket_name> <table_name>
```

`./setup-aws.sh -h` shows usages and a example.


Develop
-------

### Preparation for development

```
$ npm install
```

### Development server

```
$ npm run dev
```

Then access to `http://localhost:4200/`


Release
-------

TODO: make measure-release
TODO: make minor-release
TODO: make patch-release


Deploy
------

### Packaging

```
$ make init package
```

### Deploy by docker

```
$ make deploy-container
```

Then access to `http://localhost:8888/miroir`


### Deploy to S3

TODO: make deploy-s3


Other
-----

### Dependencies without package.json

```
"monaco-editor": "^0.8.3",
```

Migrate to `package.json` when following issue is closed.

[Support for module\.js or commonjs? · Issue \#40 · Microsoft/monaco\-editor](https://github.com/Microsoft/monaco-editor/issues/40)
