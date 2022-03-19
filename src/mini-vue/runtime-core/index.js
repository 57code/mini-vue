import { effect, reactive } from "../reactivity/index";

export function createRenderer(options) {
  const render = (rootComponent, selector) => {
    const container = options.querySelector(selector);
    // 对data做响应式处理
    const observed = reactive(rootComponent.data());

    // 为组件定义一个更新函数
    const componentUpdateFn = () => {
      const el = rootComponent.render.call(observed);
      options.setElementText(container, '')
      options.insert(el, container);
    };

    // 指定活动的副作用为该更新函数
    effect(componentUpdateFn);

    // 初始化执行一次
    componentUpdateFn();

    // mount
    if (rootComponent.mounted) {
      rootComponent.mounted.call(observed)
    }
  };

  return {
    render,
    createApp: createAppAPI(render),
  };
}

export function createAppAPI(render) {
  return function createApp(rootComponent) {
    const app = {
      mount(selector) {
        render(rootComponent, selector);
      },
    };
    return app;
  };
}
