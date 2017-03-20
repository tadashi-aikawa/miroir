# gemini-viewer

Viewer for [gemini](https://github.com/tadashi-aikawa/gemini).

Demo: https://tadashi-aikawa.github.io/gemini-viewer/

## Development server

```
$ ng serve
```

Then access to `http://localhost:4200/`

## Deploy to GitHub Pages

```
$ ng build --prod --base-href https://<user>.github.io/gemini-viewer/
$ ngh --repo=https://<github_token>@github.com/<user>/gemini-viewer.git
```

You have to specify `<user>` and `github_token` as your own.

Ex.

* `<user>`
  * tadashi-aikawa
* `github_token`
  * 7af3................ (Of course secret)
