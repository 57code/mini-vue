import { createVNode } from "vue";
import { effect, reactive } from "../reactivity";

// runtime-core
// --------custom renderer api---------
export function createRenderer(options) {
  const {
    createElement: hostCreateElement,
    insert: hostInsert,
    setElementText: hostSetElementText,
    remove: hostRemove
  } = options;

  // render负责渲染组件内容
  const render = (vnode, container) => {
    // 1.获取宿主
    // const container = options.querySelector(selector);
    // 2.渲染视图
    // const observed = reactive(rootComponent.data());
    // 3.为组件定义一个更新函数
    // const componentUpdateFn = () => {
    //   const el = rootComponent.render.call(observed);
    //   options.setElementText(container, '')
    //   // 4.追加到宿主
    //   options.insert(el, container);
    // };

    // 设置激活的副作用
    // effect(componentUpdateFn)

    // 初始化执行一次
    // componentUpdateFn()

    // 挂载钩子
    // if (rootComponent.mounted) {
    //   rootComponent.mounted.call(observed)
    // }

    // 如果存在vnode则为mount或patch，否则unmount
    if (vnode) {
      patch(container._vnode || null, vnode, container);
    }

    container._vnode = vnode;
  };

  const patch = (n1, n2, container) => {
    // 如果n2中type为字符串，说明它是原生节点element，否则是组件
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
      // patch
    }
  };

  // 挂载做三件事：
  // 1.组件实例化
  // 2.状态初始化
  // 3.副作用安装
  const mountComponent = (initialVNode, container) => {
    // 创建组件实例
    const instance = {
      data: {},
      vnode: initialVNode,
      isMounted: false,
    };

    // 初始化组件状态
    const { data: dataOptions } = instance.vnode.type;
    instance.data = reactive(dataOptions());

    // 安装渲染函数副作用
    setupRenderEffect(instance, container);
  };

  const setupRenderEffect = (instance, container) => {
    // 声明组件更新函数
    const componentUpdateFn = () => {
      const { render } = instance.vnode.type;
      if (!instance.isMounted) {
        // 创建阶段
        // 执行组件渲染函数获取其vnode
        // 保存最新的虚拟DOM，这样下次更新时可以作为旧的VNode进行比较
        const vnode = (instance.subtree = render.call(instance.data));
        // 递归patch嵌套节点
        patch(null, vnode, container);

        // 挂载钩子
        if (instance.vnode.type.mounted) {
          instance.vnode.type.mounted.call(instance.data);
        }
        instance.isMounted = true;
      } else {
        // 更新阶段
        const prevVnode = instance.subtree;
        // 获取最新的VNode
        const nextVnode = render.call(instance.data);
        // 保存下次更新使用
        instance.subtree = nextVnode;
        // 执行patch并传入新旧两个Vnode
        patch(prevVnode, nextVnode);
      }
    };
    // 建立更新机制
    effect(componentUpdateFn);

    // 首次执行组件更新函数
    componentUpdateFn();
  };

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
    const el = (vnode.el = hostCreateElement(vnode.type));

    // children如果为文本
    if (typeof vnode.children === "string") {
      el.textContent = vnode.children;
    } else {
      // 数组需要递归创建
      vnode.children.forEach((child) => patch(null, child, el));
    }

    // 插入元素
    hostInsert(el, container);
  };

  const patchElement = (n1, n2) => {
    // 获取要更新的元素节点
    const el = (n2.el = n1.el);

    // 更新type相同的节点，实际上还要考虑key
    if (n1.type === n2.type) {
      // 获取双方子元素
      const oldCh = n1.children;
      const newCh = n2.children;

      // 根据双方子元素情况做不同处理
      if (typeof oldCh === "string") {
        if (typeof newCh === "string") {
          // 对比双方文本，如果变化则更新
          if (oldCh !== newCh) {
            hostSetElementText(el, newCh);
          }
        } else {
          // 替换文本为一组子元素
          hostSetElementText(el, "");
          newCh.forEach((v) => patch(null, v, el));
        }
      } else {
        if (typeof newCh === "string") {
          // 之前是子元素数组，变化之后是文本内容
          hostSetElementText(el, newCh);
        } else {
          // 变化前后都是子元素数组
          updateChildren(oldCh, newCh, el);
        }
      }
    }
  };

  const updateChildren = (oldCh, newCh, parentElm) => {
    // A B C D E
    // A C D E
    // 获取较短的数组的长度
    const len = Math.min(oldCh.length, newCh.length);
    for (let i = 0; i < len; i++) {
      patch(oldCh[i], newCh[i]);
    }
    // 获取较长数组中剩余的部分
    if (newCh.length > oldCh.length) {
      // 新数组较长，剩余的批量创建追加
      newCh.slice(len).forEach((child) => patch(null, child, parentElm));
    } else {
      // 老数组较长，剩余的批量删除
      oldCh.slice(len).forEach(child => hostRemove(child.el))
    }
  };

  // 返回一个渲染器实例
  return {
    render,
    // 提供给用户一个createApp方法
    createApp: createAppAPI(render),
  };
}

export function createAppAPI(render) {
  return function createApp(rootComponent) {
    const app = {
      mount(container) {
        // console.log('mount！');
        // 创建根组件VNode
        const vnode = createVNode(rootComponent);
        // 传入根组件VNode而非根组件配置，render作用
        // 是将虚拟DOM转换为dom并追加至宿主
        render(vnode, container);
      },
    };
    return app;
  };
}
