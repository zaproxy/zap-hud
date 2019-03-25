<template>
  <Tabs>
    <Tab :name="$t('message.history_tool')">
      <HttpHistory></HttpHistory>
    </Tab>
    <Tab :name="$t('message.websockets_tool')">
      <WebSocketHistory></WebSocketHistory>
    </Tab>
  </Tabs>
</template>

<script>
import Tabs from "../../components/Tabs.vue";
import Tab from "../../components/Tab.vue";
import HttpHistory from "../../components/HttpHistory.vue";
import WebSocketHistory from "../../components/WebSocketHistory.vue";
export default {
  components: {
    Tabs,
    Tab,
    WebSocketHistory,
    HttpHistory
  },
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

    eventBus.$on("setMessages", data => {
      this.messages = data.messages;
    });

    eventBus.$on("updateMessages", data => {
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

<style lang="scss" scoped>
@import "../../scss/variables.scss";
.table td,
.table th {
  padding: 0; /*Override Spectre table cell padding*/
}

.drawer-header {
  position: sticky;
  top: 0;
  right: 0;
  z-index: 1; /*Needed to override absolute positioning from spectre lib*/
  background-color: #fff;
  font-size: 0.8em;
}

.drawer-header tr {
  text-align: center;
}

.drawer-filter {
  border-color: none;
}

.drawer-filter.error {
  border-color: rgb(252, 130, 130);
  background-color: rgb(248, 230, 230);
}

.drawer-messages {
  font-size: 0.7em;
  padding: 0 1%;
  margin-bottom: 1%;
}

.drawer-messages .message-tr td {
  padding: 0 5px;
}

.table .field.time,
.table .title.time {
  width: 125px;
}

.table .field.code,
.table .title.code {
  width: 75px;
}

.table .field.method,
.table .title.method {
  width: 75px;
}

.table .field.url,
.table .title.url {
  width: 75px;
}

.table .field.direction,
.table .title.direction {
  width: 125px;
}

.table .field.opcode,
.table .title.opcode {
  width: 125px;
}

.table .field.length,
.table .title.length {
  width: 95px;
}

.table .field.payload,
.table .title.payload {
  width: 150px;
}

.table .title.filter {
  width: auto;
  font-weight: normal;
}

.table .title.hidden {
  width: auto;
  font-weight: normal;
  text-align: right;
  padding-right: 2%;
}
</style>


