<template>
  <div id="app">
    <DialogModal
      :show="isDialogModalShown"
      :title="dialogModalTitle"
      :text="dialogModalText"
      @close="isDialogModalShown = false"
    ></DialogModal>
    <SelectToolModal
      :show="isSelectToolModalShown"
      :title="$t('message.hud_select_tool')"
      @close="isSelectToolModalShown = false"
    ></SelectToolModal>
    <AlertListModal
      :show="isAlertListModalShown"
      :title="alertListModalTitle"
      @close="isAlertListModalShown = false"
    ></AlertListModal>
    <AllAlertsModal
      :show="isAllAlertsModalShown"
      :title="allAlertsModalTitle"
      @close="isAllAlertsModalShown = false"
    ></AllAlertsModal>
    <AlertDetailsModal
      :show="isAlertDetailsModalShown"
      :title="alertDetailsModalTitle"
      @close="isAlertDetailsModalShown = false"
    ></AlertDetailsModal>
    <SimpleMenuModal
      :show="isSimpleMenuModalShown"
      :title="simpleMenuModalTitle"
      @close="isSimpleMenuModalShown = false"
    ></SimpleMenuModal>
    <BreakMessageModal
      :show="isBreakMessageModalShown"
      :title="breakMessageModalTitle"
      @close="isBreakMessageModalShown = false"
    ></BreakMessageModal>
    <HistoryMessageModal
      :show="isHistoryMessageModalShown"
      :title="historyMessageModalTitle"
      @close="isHistoryMessageModalShown = false"
    ></HistoryMessageModal>
    <WebsocketMessageModal
      :show="isWebsocketMessageModalShown"
      :title="websocketMessageModalTitle"
      @close="isWebsocketMessageModalShown = false"
    ></WebsocketMessageModal>
    <SiteTreeModal
      :show="isSiteTreeModalShown"
      :title="siteTreeModalTitle"
      @close="isSiteTreeModalShown = false"
    ></SiteTreeModal>
  </div>
</template>

<script>
import DialogModal from "../../components/DialogModal.vue";
import SelectToolModal from "../../components/SelectToolModal.vue";
import AlertListModal from "../../components/AlertListModal.vue";
import AllAlertsModal from "../../components/AllAlertsModal.vue";
import AlertDetailsModal from "../../components/AlertDetailsModal.vue";
import SimpleMenuModal from "../../components/SimpleMenuModal.vue";
import BreakMessageModal from "../../components/BreakMessageModal.vue";
import HistoryMessageModal from "../../components/HistoryMessageModal.vue";
import WebsocketMessageModal from "../../components/WebsocketMessageModal.vue";
import SiteTreeModal from "../../components/SiteTreeModal.vue";

export default {
  props: [],
  components: {
    DialogModal,
    SelectToolModal,
    AlertListModal,
    AllAlertsModal,
    AlertDetailsModal,
    SimpleMenuModal,
    BreakMessageModal,
    HistoryMessageModal,
    WebsocketMessageModal,
    SiteTreeModal
  }
};
</script>

<style lang="scss" scoped>
@import "../../scss/variables.scss";

body {
  background-color: transparent;
}

.site-tree-node {
  list-style: none;
  margin-left: 0;
  padding-left: 1em;
  text-indent: -1em;
}

span.errorMessages {
  color: $red;
}
</style>

