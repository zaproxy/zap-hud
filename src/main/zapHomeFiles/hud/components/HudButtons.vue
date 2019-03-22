<template id="hud-buttons-template">
  <div id="hud-buttons" :class="{'d-hide': !isVisible, 'd-visible': isVisible}">
    <HudButton
      v-for="tool in tools"
      :key="tool.name"
      :label="tool.label"
      :icon="'{{{ ZAP_HUD_FILES }}}?image=' + tool.icon"
      :data="tool.data"
      :name="tool.name"
    ></HudButton>
    <HudButton icon="{{ ZAP_HUD_FILES }}?image=plus.png" name="add-tool"></HudButton>
  </div>
</template>

<script>
import localforage from "localforage";
import HudButton from "./HudButton.vue";
import { EventBus } from "../libs/event-bus.js";

//TODO: replace tabId, frameId w/ props
//TODO: Convert searchParams to props from panel.js or Panel.vue
let params = new URL(document.location).searchParams;
const orientation = params.get("orientation");
const frameId = params.get("frameId");
const tabId = params.get("tabId");
const context = {
  url: document.referrer,
  domain: utils.parseDomainFromUrl(document.referrer)
};

export default {
  template: "#hud-buttons-template",
  components: {
    HudButton
  },
  data() {
    return {
      tools: [],
      orientation: orientation,
      isVisible: false
    };
  },
  created() {
    let self = this;
    var panel = orientation + "Panel";

    // check if currently hidden
    localforage
      .getItem("settings.isHudVisible")
      .then(isHudVisible => {
        if (isHudVisible !== null && !isHudVisible) {
          return parent.postMessage(
            { action: "hideSidePanels" },
            document.referrer
          );
        }
      })
      .then(() => {
        // hide the panels until we know whether to show them or not to prevent flashing
        this.isVisible = true;
      })
      .catch(utils.errorHandler);

    // initialize panels with tools
    utils
      .loadPanelTools(panel)
      .then(tools => {
        self.tools = tools;

        tools.forEach(tool => {
          let channel = new MessageChannel();

          channel.port1.onmessage = function(event) {
            EventBus.$emit("updateButton", {
              name: tool.name,
              data: event.data.data,
              icon: event.data.icon,
              isDisabled: event.data.isDisabled
            });
          };

          navigator.serviceWorker.controller.postMessage(
            {
              action: "getTool",
              tool: tool.name,
              context: context,
              frameId: frameId,
              tabId: tabId
            },
            [channel.port2]
          );
        });
      })
      .catch(utils.errorHandler);

    EventBus.$on("addButton", data => {
      if (self.tools.filter(tool => tool.name === data.name) > 0) {
        throw new Error(
          'Attempted to add tool "' +
            data.name +
            '" to ' +
            orientation +
            "panel, but it has already been added."
        );
      } else {
        self.tools.push(data.tool);
      }
    });

    // listen to remove buttons
    EventBus.$on("removeButton", data => {
      self.tools = self.tools.filter(tool => tool.name !== data.name);
    });
  }
};
</script>

<style lang="scss" scoped>
@import "../scss/variables.scss";
</style>

