import { reactive } from '../index'

test('reactive should work', () => { 
  const original = {foo: 'foo'}
  const observed = reactive(original)
  
  // 代理对象是全新的对象
  expect(observed).not.toBe(original)

  // 能够访问所代理对象的属性
  expect(observed.foo).toBe('foo')

  // 能够修改所代理对象的属性
  observed.foo = 'foooooooo~'
  expect(original.foo).toBe('foooooooo~')

  // 能够新增所代理对象的属性
  observed.bar = 'bar'
  expect(original.bar).toBe('bar')

  // 能够删除所代理对象的属性
  delete observed.bar
  expect(original.bar).toBe(undefined)
  
 })