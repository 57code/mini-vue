// import { createApp } from 'vue'
import { createApp } from "./mini-vue";
import { createVNode } from "./mini-vue/runtime-core/vnode";
// import App from './App.vue'

createApp({
  data() {
    return {
      title: ["hello,", "mini-vue!", "very good"],
    };
  },
  render() {
    // const h3 = document.createElement('h3')
    // h3.textContent = this.title
    // return h3
    // 返回VNode
    // return createVNode('h3', {}, this.title)
    // text=》array
    if (Array.isArray(this.title)) {
      return createVNode(
        "h3",
        {},
        this.title.map((t) => createVNode("p", {}, t))
      );
    } else {
      return createVNode("h3", {}, this.title);
    }
  },
  mounted() {
    setTimeout(() => {
      this.title = ["wow,", "data change!"];
    }, 2000);
  },
}).mount("#app");
