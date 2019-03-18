<template>
  <div id="app">
	  <HudButtons/>
  </div>
</template>

<script>
  import HudButtons from '../../components/HudButtons.vue'
  export default {
    components: {
      HudButtons
    }
  }
</script>

<style lang="scss" scoped>
  @import '../../scss/variables.scss';

  body {
    background: none transparent;
  }
</style>
