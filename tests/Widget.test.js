import sinon from 'sinon';
import expect from 'expect.js';
import { Widget } from '../src/Widget';

describe('Widget Tests', () => {
  const lastWindow = window;
  const setUp = () => {
    const widget = new Widget();

    return widget;
  };

  afterEach(() => {
    global.window = lastWindow;
    sinon.reset();
    sinon.restore();
  });

  it('The widget should receive the widget settings through a specific variable in the window ang get accesed trhou the interface', () => {
    window._pluginWidgetSettings = {
      keyTest: 'Test',
    };
    const widget = setUp();
    const settings = widget.getSettings();

    expect(settings.keyTest).to.equal('Test');
  });
});
