<template>
  <div>
    <table class="table drawer-header">
      <thead>
        <tr>
          <th class="title time" v-t="message.websockets_message_field_time"></th>
          <th class="title direction" v-t="message.websockets_message_field_direction"></th>
          <th class="title opcode" v-t="message.websockets_message_field_opcode"></th>
          <th class="title length" v-t="message.websockets_message_field_bytes"></th>
          <th class="title payload" v-t="message.websockets_message_field_payload"></th>
          <th class="title filter">
            <span>
              <input
                id="websockets-filter"
                class="drawer-filter"
                v-model="filter"
                type="text"
                v-bind:class="{ 'error': isRegExError }"
                placeholder="Filter"
              >
            </span>
            <span>
              <input v-model="regexEnabled" type="checkbox">
            </span>
            <span>{{ enableRegExText }}</span>
          </th>
          <th class="title hidden">
            <span>{{ websocketsItemsFilteredMessage }}</span>
          </th>
        </tr>
      </thead>
    </table>
    <table
      id="websockets-messages"
      class="table table-striped table-hover table-scroll table-history drawer-messages"
      style="min-width: fit-content;"
    >
      <tbody>
        <tr
          v-for="message in filteredMessages"
          @click="messageSelected(message.channelId, message.messageId)"
          :id="'message-tr-'+message.messageId"
          class="message-tr"
          :key="message.messageId"
        >
          <td class="field time">{{ message.time }}</td>
          <td class="field direction">
            {{
            $t(
            "message.websockets_direction_" +
            message.direction.toLowerCase()
            )
            }}
          </td>
          <td class="field opcode">{{ message.opCode }}</td>
          <td class="field length">{{ message.length }}</td>
          <td class="field payload">{{ message.messageSummary }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { EventBus } from "../libs/event-bus.js";

export default {
  data() {
    return {
      filter: "",
      regexEnabled: false,
      messages: [],
      hiddenMessageCount: 0,
      isRegExError: false,
      websocketsItemsFilteredMessage: "",
      enableRegExText: I18n.t("common_enable_regex")
    };
  },
  computed: {
    timeDescendingMessages() {
      return this.messages.slice().reverse();
    },
    messageCount() {
      return this.messages.length;
    },
    filteredMessages() {
      const self = this,
        isRegex = this.regexEnabled;
      let re;

      if (isRegex) {
        try {
          re = new RegExp(this.filter);
          this.isRegExError = false;
        } catch (ex) {
          this.isRegExError = true;
          return []; //Return empty array if invalid RegEx
        }
      }

      return this.messages.filter(message => {
        if (self.filter.trim().length === 0) {
          return true;
        }
        if (isRegex) {
          return re.test(message.messageSummary);
        } else {
          return message.messageSummary.indexOf(self.filter) >= 0;
        }
      });
    }
  },
  methods: {
    messageSelected(channelId, messageId) {
      navigator.serviceWorker.controller.postMessage({
        tabId: tabId,
        frameId: frameId,
        action: "showWebSocketMessageDetails",
        tool: "websockets",
        channelId: channelId,
        messageId: messageId
      });
    },
    websocketsItemsFiltered() {
      this.websocketsItemsFilteredMessage = I18n.t("common_items_filtered", [
        this.hiddenMessageCount,
        this.messageCount
      ]);
    }
  },
  watch: {
    regexEnabled() {
      this.isRegExError = !this.regexEnabled ? false : this.isRegExError;
    },
    filteredMessages() {
      this.$nextTick(function() {
        const visibleMessages = document.querySelectorAll(
          "#websockets-messages .message-tr"
        );
        this.hiddenMessageCount = !this.messages
          ? 0
          : this.messages.length - visibleMessages.length;
        this.websocketsItemsFiltered();
      });
    }
  },
  created() {
    utils
      .loadTool("websockets")
      .then(tool => {
        this.messages = tool.messages;
      })
      .catch(utils.errorHandler);

    EventBus.$on("setMessages", data => {
      this.messages = data.messages;
    });

    EventBus.$on("updateWebSockets", data => {
      this.messages = this.messages.concat(data.messages);

      let count = data.messages.length;
      this.$parent.$emit("badgeDataEvent", { data: count });
    });
  },
  updated() {
    if (this.messages.length > 0) {
      let lastMessage = this.messages[this.messages.length - 1];
      let lastid = "message-tr-" + lastMessage.messageId;
      let lastIdElem = document.querySelector(lastid);
      if (lastIdElem) {
        lastIdElem.scrollIntoView({ block: "end", behavior: "smooth" });
      }

      //move horizontal scroll bar to the left
      let tabsDetailsElems = document.querySelectorAll("tabs-details");
      if (tabsDetailsElems.length > 0) {
        tabsDetails[0].scrollTo(0, tabsDetails.scrollHeight);
      }
    }
  }
};
</script>

<style lang="scss" scoped>
</style>