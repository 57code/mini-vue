import { createRenderer } from "../runtime-core";

let renderer;
const rendererOptions = {
  querySelector(selector) {
    return document.querySelector(selector);
  },
  insert(child, parent, anchor) {
    parent.insertBefore(child, anchor || null);
  },
  setElementText(el, text) {
    el.textContent = text;
  },
  createElement(tag) {
    return document.createElement(tag);
  },
  remove: (child) => {
    const parent = child.parentNode;
    if (parent) {
      parent.removeChild(child);
    }
  },
};
function ensureRenderer() {
  return renderer || (renderer = createRenderer(rendererOptions));
}
export function createApp(rootComponent) {
  const app = ensureRenderer().createApp(rootComponent);
  const mount = app.mount;
  app.mount = function (containerOrSelector) {
    // 获取宿主元素
    if (typeof containerOrSelector === "string") {
      containerOrSelector = document.querySelector(containerOrSelector);
    }
    mount(containerOrSelector);
  };
  return app;
}
