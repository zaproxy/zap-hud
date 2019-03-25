<template>
  <div
    :class="{'hud-button': true, 'small': true, 'active': isActive}"
    @click="$emit('click');"
    @mouseover="mouseOver"
    @mouseleave="mouseLeave"
  >
    <img :src="icon">
    <span>{{ label }}</span>
  </div>
</template>

<script>
export default {
  props: ["label", "icon", "data"],
  data() {
    return {
      showData: false,
      isActive: false
    };
  },
  methods: {
    mouseOver() {
      this.isActive = true;
    },
    mouseLeave() {
      this.isActive = false;
    }
  }
};
</script>
