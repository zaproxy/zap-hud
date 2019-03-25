<template>
  <div>
    <table class="table drawer-header">
      <thead>
        <tr>
          <th class="title time" v-t="message.history_http_message_field_time"></th>
          <th class="title code" v-t="message.history_http_message_field_code"></th>
          <th class="title method" v-t="message.history_http_message_field_method"></th>
          <th class="title url" v-t="message.history_http_message_field_url"></th>
          <th class="title filter">
            <span>
              <input
                id="history-filter"
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
            <span>{{ historyItemsFilteredMessage }}</span>
          </th>
        </tr>
      </thead>
    </table>
    <table
      id="history-messages"
      class="table table-striped table-hover table-scroll table-history drawer-messages"
      style="min-width: fit-content;"
    >
      <tbody>
        <tr
          v-for="message in filteredMessages"
          @click="messageSelected(message.id)"
          :id="'message-tr-'+message.id"
          class="message-tr"
          :key="message.id"
        >
          <td class="field time">{{ message.time }}</td>
          <td class="field code">{{ message.code }}</td>
          <td class="field method">{{ message.method }}</td>
          <td class="field url">{{ message.url }}</td>
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
      historyItemsFilteredMessage: "",
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
          return re.test(message.url);
        } else {
          return message.url.indexOf(self.filter) >= 0;
        }
      });
    }
  },
  methods: {
    messageSelected(id) {
      navigator.serviceWorker.controller.postMessage({
        tabId: tabId,
        frameId: frameId,
        action: "showHttpMessageDetails",
        tool: "history",
        id: id
      });
    },
    historyItemsFiltered() {
      this.historyItemsFilteredMessage = I18n.t("common_items_filtered", [
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
          "#history-messages .message-tr"
        );
        this.hiddenMessageCount = !this.messages
          ? 0
          : this.messages.length - visibleMessages.length;
        this.historyItemsFiltered();
      });
    }
  },
  created() {
    utils
      .loadTool("history")
      .then(tool => {
        this.messages = tool.messages;
      })
      .catch(utils.errorHandler);

    EventBus.$on("setMessages", data => {
      this.messages = data.messages;
    });

    EventBus.$on("updateMessages", data => {
      this.messages = this.messages.concat(data.messages);

      let count = data.messages.length;
      this.$parent.$emit("badgeDataEvent", { data: count });
    });
  },
  updated() {
    if (this.messages.length > 0) {
      let lastMessage = this.messages[this.messages.length - 1];
      let lastid = "message-tr-" + lastMessage.id;
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

<style lang="sass" scoped>

</style>