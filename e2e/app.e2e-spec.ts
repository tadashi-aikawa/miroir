import { GeminiViewerPage } from './app.po';

describe('gemini-viewer App', function() {
  let page: GeminiViewerPage;

  beforeEach(() => {
    page = new GeminiViewerPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
