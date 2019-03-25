<template>
  <DrawerButton :icon="icon" @click="toggleIsVisible"></DrawerButton>
</template>

<script>
import localforage from "localforage";
import DrawerButton from "./DrawerButton.vue";

export default {
  props: [],
  components: {
    DrawerButton
  },
  data() {
    return {
      icon: utils.getZapImagePath("radar.png"),
      isHudVisible: true
    };
  },
  methods: {
    showHud() {
      this.isHudVisible = true;
      this.icon = utils.getZapImagePath("radar.png");
      localforage
        .setItem("settings.isHudVisible", true)
        .catch(utils.errorHandler);
      parent.postMessage(
        { tabId: tabId, frameId: frameId, action: "showSidePanels" },
        document.referrer
      );
    },
    hideHud() {
      this.isHudVisible = false;
      this.icon = utils.getZapImagePath("radar-grey.png");
      localforage
        .setItem("settings.isHudVisible", false)
        .catch(utils.errorHandler);
      parent.postMessage(
        { tabId: tabId, frameId: frameId, action: "hideSidePanels" },
        document.referrer
      );
    },
    toggleIsVisible() {
      this.isHudVisible ? this.hideHud() : this.showHud();
    }
  },
  created() {
    localforage
      .getItem("settings.isHudVisible")
      .then(isHudVisible => {
        this.isHudVisible = isHudVisible;
        if (!this.isHudVisible) {
          this.icon = utils.getZapImagePath("radar-grey.png");
        }
      })
      .catch(utils.errorHandler);
  }
};
</script>

