import { HogePage } from './app.po';

describe('hoge App', () => {
  let page: HogePage;

  beforeEach(() => {
    page = new HogePage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
