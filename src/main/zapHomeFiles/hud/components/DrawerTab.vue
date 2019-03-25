<template>
  <div v-show="isActive">
    <slot></slot>
  </div>
</template>

<script>
export default {
  props: {
    name: { required: true },
    selected: { default: false }
  },
  data() {
    return {
      isActive: false,
      badgeData: 0
    };
  },
  computed: {
    href() {
      return "#" + this.name.toLowerCase().replace(/ /g, "-");
    },
    isBadgeData() {
      return this.badgeData > 0;
    }
  },
  mounted() {
    this.isActive = this.selected;
  },
  created() {
    let self = this;

    this.$on("badgeDataEvent", message => {
      if (!self.$parent.isOpen || !self.isActive) {
        self.badgeData += message.data;
      }
    });
  }
};
</script>

<style <style lang="scss" scoped>
</style>
