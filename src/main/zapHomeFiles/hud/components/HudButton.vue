<template id="hud-button-template">
  <!-- TODO: Convert all styles below to scoped style classes -->
  <div
    :class="{'hud-button': true, 'small': isSmall, 'active': isActive, 'disabled': isDisabled}"
    :style="{'float': orientation, 'direction': direction}"
    @click="selectButton"
    @contextmenu="showContextMenu"
    @mouseover="mouseOver"
    @mouseleave="mouseLeave"
  >
    <img :src="currentIcon" :style="{'float': orientation}">
    <span
      id="data"
      v-show="showData"
      :style="{'float': orientation, 'margin-left': marginleft, 'margin-right': marginright}"
    >{{currentData}}</span>
    <span
      id="label"
      @transitionend="transitionEnd"
      :style="{'float': orientation, 'margin-left': labelmarginleft, 'margin-right': labelmarginright}"
    >{{label}}</span>
  </div>
</template>

<script>
import { EventBus } from "../libs/event-bus.js";
const IMAGE_URL = `${process.env.ZAP_HUD_FILES}?image=`;

//TODO: Convert searchParams to props
let params = new URL(document.location).searchParams;

//TODO: replace tabId, frameId w/ props
const orientation = params.get("orientation");
const panelKey = orientation + "Panel";
const frameId = params.get("frameId");
const tabId = params.get("tabId");
const context = {
  url: document.referrer,
  domain: utils.parseDomainFromUrl(document.referrer)
};

window.name = panelKey;

export default {
  template: "#hud-button-template",
  props: ["label", "name", "icon", "data"],
  data() {
    return {
      currentData: this.data,
      currentIcon: this.icon,
      showData: true,
      orientation: orientation,
      marginleft: "0rem",
      marginright: "0rem",
      labelmarginleft: "0rem",
      labelmarginright: "0rem",
      isActive: false,
      isDisabled: false,
      isClosed: true,
      direction: "ltr"
    };
  },
  computed: {
    isSmall: function() {
      return this.currentData == null;
    }
  },
  methods: {
    selectButton() {
      navigator.serviceWorker.controller.postMessage({
        action: "buttonClicked",
        buttonLabel: this.name,
        tool: this.name,
        domain: context.domain,
        url: context.url,
        panelKey: panelKey,
        frameId: frameId,
        tabId: tabId
      });
    },
    showContextMenu(event) {
      event.preventDefault();
      navigator.serviceWorker.controller.postMessage({
        action: "buttonMenuClicked",
        tool: this.name,
        frameId: frameId,
        tabId: tabId
      });
    },
    mouseOver() {
      this.labelmarginleft = this.marginleft;
      this.labelmarginright = this.marginright;
      this.isActive = true;
      this.isClosed = false;
      expandPanel();
    },
    mouseLeave() {
      this.labelmarginleft = "0rem";
      this.labelmarginright = "0rem";
      this.isActive = false;
    },
    transitionEnd() {
      let areAllButtonsClosed = true;

      if (!this.isActive) {
        this.isClosed = true;
      }

      this.$parent.$children.forEach(child => {
        if (!child.isClosed) {
          areAllButtonsClosed = false;
        }
      });

      if (areAllButtonsClosed) {
        contractPanel();
      }
    }
  },
  created() {
    let self = this;

    // set the margins depending on the orientation
    if (orientation === "left") {
      self.marginleft = ".5rem";
      self.direction = "ltr";
    } else {
      self.marginright = ".5rem";
      self.direction = "rtl";
    }

    EventBus.$on("updateButton", data => {
      utils.log(
        LOG_TRACE,
        "panel.updateButton",
        "updating button: " + data.name,
        data
      );

      if (self.name === data.name) {
        if (data.icon !== undefined) {
          self.currentIcon = IMAGE_URL + data.icon;
        }

        if (data.data !== undefined) {
          self.currentData = data.data;
        }

        if (data.isDisabled !== undefined) {
          self.isDisabled = data.isDisabled;
        }
      }
    });
  }
};
</script>

<style lang="scss" scoped>
@import "../scss/variables.scss";
</style>