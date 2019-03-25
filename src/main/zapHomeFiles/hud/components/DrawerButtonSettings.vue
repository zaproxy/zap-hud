<template>
  <DrawerButton icon="{{{ ZAP_HUD_FILES }}}?image=gear.png" @click="showHudSettings"></DrawerButton>
</template>

<script>
import DrawerButton from "./DrawerButton.vue";
export default {
  components: {
    DrawerButton
  },
  props: [],
  methods: {
    //TODO: Need tabId and frameId passed in props
    showHudSettings() {
      navigator.serviceWorker.controller.postMessage({
        tabId: tabId,
        frameId: frameId,
        action: "showHudSettings"
      });
    }
  }
};
</script>

<style lang="scss" scoped>
</style>


