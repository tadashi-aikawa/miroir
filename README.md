Miroir
======

<img src="./src/assets/miroir.png" width="240" height="240">

Viewer for [jumeaux](https://github.com/tadashi-aikawa/jumeaux).


📜 Documentation
------------------

https://tadashi-aikawa.github.io/miroir


☁ AWS Setup
------------

```
$ ./setup-aws.sh <bucket_name> <table_name>
```

`./setup-aws.sh -h` shows usages and a example.


💻 Develop
------------

### Preparation for development

```
$ npm install
```

### Development server

```
$ make dev
```

Then access to `http://localhost:4200/`

### Serve documentation

```
$ make serve-docs
```

📦 Release
------------

**Window is OK!! Good 👍**

Before release, you need to `Confirm that your branch name equals release version`

1. `make add-release` for createing `docs/releases/*.md`
2. Update `docs/_sidebar.md`
3. Update version in `docs/index.md`
4. Check Miroir and documentation
5. `make release`

Finally, create pull request and merge to master!!


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

