<template id="site-tree-node-template">
  <li>
    <div :class="{bold: ! model.isLeaf}">
      <span v-if="! model.isLeaf" @click="toggle">[{{ open ? "-" : "+" }}]</span>
      <span v-if="model.hrefId > 0" @click="showHttpMessageDetails">
        <a href="#">{{ model.name }}</a>
      </span>
      <span v-if="model.hrefId == 0" @click="toggle">{{ model.name }}</span>
    </div>
    <ul v-show="open" v-if="! model.isLeaf && open">
      <SiteTreeNode
        class="site-tree-node"
        v-for="(model, index) in model.children"
        :key="index"
        :model="model"
      ></SiteTreeNode>
    </ul>
  </li>
</template>

<script>
import { EventBus } from "../libs/event-bus.js";
import VueI18n from "vue-i18n";

export default {
  template: "#site-tree-node-template",
  props: {
    model: Object
  },
  methods: {
    toggle: function() {
      if (!this.model.isLeaf) {
        this.open = !this.open;
        if (this.open) {
          this.showChildren();
        } else {
          // We always want to query ZAP when expanding a node
          Vue.set(this.model, "children", []);
        }
      }
    },
    showHttpMessageDetails: function() {
      //TODO: replace app (Vue context w/ props)
      //TODO: replace tabId, frameId w/ props
      app.keepShowing = true;
      app.isSiteTreeModalShown = false;
      navigator.serviceWorker.controller.postMessage({
        tabId: tabId,
        frameId: frameId,
        action: "showHttpMessageDetails",
        tool: "history",
        id: this.model.hrefId
      });
    },
    showChildren: function() {
      this.addChild(I18n.t("sites_children_loading"), false);
      var treeNode = this;
      let channel = new MessageChannel();

      channel.port1.onmessage = function(event) {
        // Remove the ..loading.. child
        //TODO: Is this Vue reference valid after refactor
        Vue.set(treeNode.model, "children", []);
        for (var i = 0; i < event.data.childNodes.length; i++) {
          var child = event.data.childNodes[i];
          treeNode.addChild(
            child.name,
            child.method,
            child.isLeaf,
            child.hrefId
          );
        }
      };
      navigator.serviceWorker.controller.postMessage(
        {
          action: "zapApiCall",
          component: "core",
          type: "view",
          name: "childNodes",
          params: { url: this.model.url }
        },
        [channel.port2]
      );
    },
    addChild: function(name, method, isLeaf, hrefId) {
      if (name.slice(-1) == "/") {
        name = name.slice(0, -1);
      }
      if ((name.match(/\//g) || []).length > 2) {
        // If there are more than 2 slashes just show last url element
        // The first 2 slashes will be http(s)://...
        name = name.substring(name.lastIndexOf("/") + 1);
      }
      if (isLeaf) {
        name = method + ": " + name;
      }
      this.model.children.push({
        name: name,
        isLeaf: isLeaf,
        hrefId: hrefId,
        method: method,
        children: [],
        url: this.model.url === "" ? name : this.model.url + "/" + name
      });
    }
  },
  data() {
    return {
      name: I18n.t("sites_tool"),
      open: false
    };
  }
};
</script>

<style lang="scss">
</style>

