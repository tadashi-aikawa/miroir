# jumeaux-viewer

Viewer for [jumeaux](https://github.com/tadashi-aikawa/jumeaux).

Demo: https://tadashi-aikawa.github.io/jumeaux-viewer/

## Development server

```
$ ng serve
```

Then access to `http://localhost:4200/`

## Deploy to GitHub Pages

```
$ ng build --prod --base-href https://<user>.github.io/jumeaux-viewer/
$ ngh --repo=https://<github_token>@github.com/<user>/jumeaux-viewer.git
```

You have to specify `<user>` and `github_token` as your own.

Ex.

* `<user>`
  * tadashi-aikawa
* `github_token`
  * 7af3................ (Of course secret)
