import { effect, reactive } from "../reactivity/index";
import { createVNode } from "./vnode";

export function createRenderer(options) {
  // const render = (rootComponent, selector) => {
  //   const container = options.querySelector(selector);
  //   // 对data做响应式处理
  //   const observed = reactive(rootComponent.data());

  //   // 为组件定义一个更新函数
  //   const componentUpdateFn = () => {
  //     const el = rootComponent.render.call(observed);
  //     options.setElementText(container, "");
  //     options.insert(el, container);
  //   };

  //   // 指定活动的副作用为该更新函数
  //   effect(componentUpdateFn);

  //   // 初始化执行一次
  //   componentUpdateFn();

  //   // mount
  //   if (rootComponent.mounted) {
  //     rootComponent.mounted.call(observed);
  //   }
  // };
  const {
    createElement: hostCreateElement,
    // querySelector: hostQuerySelector,
    insert: hostInsert,
    remove: hostRemove
  } = options;

  const render = (vnode, container) => {
    // mount或patch操作
    if (vnode) {
      patch(container._vnode || null, vnode, container);
    }
    // dom保存vnode
    container._vnode = vnode;
  };

  const patch = (n1, n2, container) => {
    const { type } = n2;
    if (typeof type === "string") {
      // element
      processElement(n1, n2, container);
    } else {
      // component
      processComponent(n1, n2, container);
    }
  };

  const processComponent = (n1, n2, container) => {
    if (n1 == null) {
      // mount
      mountComponent(n2, container);
    } else {
      // update
      updateComponent(n1, n2);
    }
  };

  const mountComponent = (initialVNode, container) => {
    // 创建组件实例
    const instance = {
      data: {},
      vnode: initialVNode,
      isMounted: false,
    };
    initialVNode.component = instance;

    // 初始化组件状态
    const { data: dataOptions } = instance.vnode.type;
    instance.data = reactive(dataOptions());

    // 安装渲染副作用
    setupRenderEffect(instance, container);
  };

  // 执行组件首次渲染，并将更新函数设置为副作用
  const setupRenderEffect = (instance, container) => {
    // 声明组件更新函数
    const componentUpdateFn = (instance.update = () => {
      // 渲染获取组件视图VNode
      const { render } = instance.vnode.type;

      if (!instance.isMounted) {
        // 创建阶段获取VNode
        const vnode = (instance.subtree = render.call(instance.data));

        // 递归patch嵌套节点
        patch(null, vnode, container);

        // 调用钩子函数
        if (instance.vnode.type.mounted) {
          instance.vnode.type.mounted.call(instance.data);
        }
        instance.isMounted = true;
      } else {
        // 更新阶段
        // 从实例获取上次结果
        const prevVnode = instance.subtree;
        // 重新获取最新结果
        const nextVnode = render.call(instance.data);
        // 保存下次更新使用
        instance.subtree = nextVnode;
        patch(prevVnode, nextVnode);
      }
    });

    // 设置副作用
    effect(componentUpdateFn);

    // 首次执行更新函数
    componentUpdateFn();
  };

  // 处理native元素
  const processElement = (n1, n2, container) => {
    if (n1 == null) {
      // 创建阶段
      mountElement(n2, container);
    } else {
      // 更新阶段
      patchElement(n1, n2);
    }
  };

  const mountElement = (vnode, container) => {
    // 创建元素
    const el = (vnode.el = hostCreateElement(vnode.type));

    // children为文本
    if (typeof vnode.children === "string") {
      el.textContent = vnode.children;
    } else {
      // children为数组需递归
      vnode.children.forEach((child) => patch(null, child, el));
    }

    // 插入元素
    hostInsert(el, container);
  };

  // 对比n1和n2，找到更新点
  const updateComponent = (n1, n2) => {
    // 通常根据属性、子元素等判断是否需要更新,
    // 这里简化直接更新, 获取组件实例调用其更新函数
    const instance = (n2.component = n1.component);
    instance.componentUpdateFn();
  };

  const patchElement = (n1, n2) => {
    // 获取要操作元素
    const el = (n2.el = n1.el);

    // 更新type相同节点
    if (n1.type === n2.type) {
      const oldCh = n1.children;
      const newCh = n2.children;

      if (typeof oldCh === "string") {
        if (typeof newCh === "string") {
          if (oldCh !== newCh) {
            el.textContent = newCh;
          }
        } else {
          // replace text with elements
          // 变化前后都是子元素数组
          el.textContent = "";
          newCh.forEach((v) => patch(null, v, el));
        }
      } else {
        if (typeof newCh === "string") {
          // replace elements with text
          el.textContent = newCh;
        } else {
          // update children
          updateChildren(oldCh, newCh, el);
        }
      }
    }
  };

  const updateChildren = (oldCh, newCh, parentElm) => {
    // 这⾥暂且直接patch对应索引的两个节点
    const len = Math.min(oldCh.length, newCh.length);
    for (let i = 0; i < len; i++) {
      patch(oldCh[i], newCh[i]);
    }
    // newCh若是更⻓的那个，说明有新增
    if (newCh.length > oldCh.length) {
      newCh.slice(len).forEach((child) => patch(null, child, parentElm));
    } else if (newCh.length < oldCh.length) {
      // oldCh若是更⻓的那个，说明有删减
      oldCh.slice(len).forEach((child) => hostRemove(child.el));
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
        // 创建根组件VNode
        const vnode = createVNode(rootComponent);
        // 传入根组件VNode而不是配置
        render(vnode, selector);
      },
    };
    return app;
  };
}
