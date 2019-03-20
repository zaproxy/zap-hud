<template id="select-tool-modal-template">
  <Modal :title="title" :show="show" @close="close">
    <div slot="body">
      <ul class="menu">
        <ToolListItem
          v-for="tool in tools"
          :image="tool.image"
          :label="tool.label"
          :key="tool.toolname"
          :toolname="tool.toolname"
          :port="port"
          @close="close"
        ></ToolListItem>
      </ul>
    </div>
  </Modal>
</template>


<script>
import Modal from "./Modal.vue";
import ToolListItem from "./ToolListItem.vue";

export default {
  template: "#select-tool-modal-template",
  props: ["show", "title"],
  components: {
    Modal,
    ToolListItem
  },
  methods: {
    close: function() {
      this.$emit("close");
    }
  },
  data() {
    return {
      port: null,
      tools: []
    };
  },
  created: function() {
    let self = this;

    EventBus.$on("showSelectToolModal", data => {
      //TODO: replace app (Vue context w/ props)
      app.isSelectToolModalShown = true;

      self.tools = data.tools;
      self.port = data.port;
    });
  }
};
</script>

<style lang="scss" scoped>
</style>
