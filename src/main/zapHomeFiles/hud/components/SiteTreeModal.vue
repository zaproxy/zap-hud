<template id="site-tree-modal-template">
  <Modal :title="title" :show="show" size="wide" @close="close">
    <div slot="body">
      <ul id="site-tree-top">
        <SiteTreeNode class="site-tree-node" :model="model"></SiteTreeNode>
      </ul>
    </div>
  </Modal>
</template>

<script>
import { EventBus } from "../libs/event-bus.js";
import VueI18n from "vue-i18n";
import Modal from "./Modal.vue";
import SiteTreeNode from "./SiteTreeNode.vue";

export default {
  template: "#site-tree-modal-template",
  props: {
    title: "",
    show: ""
  },
  components: {
    Modal,
    SiteTreeNode
  },
  methods: {
    close: function() {
      this.$emit("close");
    }
  },
  data() {
    return {
      port: null,
      name: I18n.t("sites_tool"),
      open: false,
      model: {
        name: I18n.t("sites_title"),
        isLeaf: false,
        hrefId: 0,
        url: "",
        method: "",
        children: []
      }
    };
  },
  created() {
    let self = this;

    EventBus.$on("showSiteTreeModal", data => {
      self.port = data.port;

      //TODO: replace app (Vue context w/ props)
      app.isSiteTreeModalShown = true;
      app.siteTreeModalTitle = data.title;
    });
  }
};
</script>

<style lang="scss" scoped>
</style>

