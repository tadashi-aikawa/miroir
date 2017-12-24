Miroir
======

<img src="./src/assets/miroir.png" width="240" height="240">

Viewer for [jumeaux](https://github.com/tadashi-aikawa/jumeaux).


Documentation
-------------

https://tadashi-aikawa.github.io/miroir


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

1. Create `docs/releases/*.md` and Update `docs/_sidebar.md`
2. `git commit` above
3. `npm version [major|minor|patch]`
4. Check Miroir and documentation
5. `git push`


Deploy
------

### Packaging

```
$ make package
```

### Deploy by docker

```
$ make deploy-container
```

Then access to `http://localhost:8888/miroir`


### Deploy to S3

```
$ make deploy-s3 BUCKET=your-miroir-bucket
```


Other
-----

### Dependencies without package.json

```
"monaco-editor": "^0.8.3",
```

Migrate to `package.json` when following issue is closed.

[Support for module\.js or commonjs? · Issue \#40 · Microsoft/monaco\-editor](https://github.com/Microsoft/monaco-editor/issues/40)
