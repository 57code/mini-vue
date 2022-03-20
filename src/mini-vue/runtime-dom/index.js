// runtime-dom
import { createRenderer } from "../runtime-core";

let renderer;

// dom平台特有的节点操作
const rendererOptions = {
  querySelector(selector) {
    return document.querySelector(selector);
  },
  insert(child, parent, anchor) {
    // 设置为null则为appendChild
    parent.insertBefore(child, anchor || null);
  },
};

// 确保renderer单例
function ensureRenderer() {
  return renderer || (renderer = createRenderer(rendererOptions));
}

// 创建App实例
export function createApp(rootComponent) {
  // console.log(rootComponent);
  // 接收根组件，返回App实例
  return ensureRenderer().createApp(rootComponent);
}
