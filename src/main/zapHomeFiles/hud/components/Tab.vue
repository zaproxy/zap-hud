<template id="tab-template">
  <div v-show="isActive">
    <slot></slot>
  </div>
</template>

<script>
export default {
  template: "#tab-template",
  props: {
    name: { required: true },
    selected: { default: false },
    disabled: { default: false }
  },
  data() {
    return {
      isActive: false,
      isDisabled: false
    };
  },
  computed: {
    href() {
      return "#" + this.name.toLowerCase().replace(/ /g, "-");
    }
  },
  mounted() {
    this.isActive = this.selected;
    this.isDisabled = this.disabled;
  }
};
</script>

<style lang="scss" scoped>
</style>

