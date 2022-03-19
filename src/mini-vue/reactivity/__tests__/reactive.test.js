import { reactive } from "../index";

test("reactive should work", () => {
  const original = {foo: 'foo'}
  const observed = reactive(original)
  // 代理对象是一个全新对象
  expect(observed).not.toBe(original)
  // 能够访问代理对象的属性
  expect(observed.foo).toBe('foo')
  // 能够修改代理对象的属性
  observed.foo = 'fooooooo~'
  expect(original.foo).toBe('fooooooo~')
  // 能够新增代理对象的属性
  observed.bar = 'bar'
  expect(original.bar).toBe('bar');
  // 能够删除代理对象的属性
  delete observed.bar
  expect(original.bar).toBe(undefined);
});
