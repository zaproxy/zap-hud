<template id="nav-modal-template">
  <Modal :title="title" :show="show" @close="close">
    <div slot="header">
      <button class="btn btn-action btn-sm float-left" @click="back">
        <i class="icon icon-back"></i>
      </button>
    </div>
    <div slot="body">
      <slot name="body"></slot>
    </div>
    <div slot="footer">
      <slot name="footer"></slot>
    </div>
  </Modal>
</template>

<script>
import Modal from "./Modal.vue";
export default {
  template: "#nav-modal-template",
  props: ["show", "title", "text"],
  components: {
    Modal
  },
  methods: {
    close: function() {
      this.$emit("close");
    },
    back() {
      this.$emit("back");
    }
  }
};
</script>

<style lang="scss" scoped>
</style>
