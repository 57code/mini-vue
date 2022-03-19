export let activeEffect;
export function effect(fn) {
  activeEffect = fn
}
// reactive返回传入obj的代理对象，值更新时使app更新
export function reactive(obj) {
  return new Proxy(obj, {
    get(target, key) {
      const value = Reflect.get(target, key);
      track(target, key)
      return value
    },
    set(target, key, value) {
      const result = Reflect.set(target, key, value);
      trigger(target, key)
      return result
    },
    deleteProperty(target, key) {
      const result = Reflect.deleteProperty(target, key);
      trigger(target, key)
      return result
    },
  });
}

const targetMap = new WeakMap()

function track(target, key) {
  if (activeEffect) {
    let depsMap = targetMap.get(target)

    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()))
    }

    let deps = depsMap.get(key)
    if (!deps) {
      depsMap.set(key, (deps = new Set()))
    }

    deps.add(activeEffect)
  }
}

function trigger(target, key) {
  const depsMap = targetMap.get(target)

  if (depsMap) {
    const deps = depsMap.get(key)

    if (deps) {
      deps.forEach(dep => dep())
    }
  }
}