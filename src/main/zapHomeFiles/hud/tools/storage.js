/*
 * Storage Tool
 *
 * Displays sessionStorage and localStorage interactions (whether elements are
 * added, removed or updated to them) in a tab at the bottom of the screen.
 */

var Storage = (function() {
  var NAME = "storage";
  var LABEL = I18n.t("storage_tool");
  var ICONS = {
    CLOCK: "clock.png"
  };
  var tool = {};

  function initializeStorage() {
    tool.name = NAME;
    tool.label = LABEL;
    tool.data = 0;
    tool.icon = ICONS.CLOCK;
    tool.isSelected = false;
    tool.isHidden = true;
    tool.panel = "";
    tool.position = 0;
    tool.messages = [];

    utils.writeTool(tool);
  }

  function showOptions(tabId) {
    var config = {
      tool: NAME,
      toolLabel: LABEL,
      options: {remove: I18n.t("common_remove")}
    };

    utils.messageFrame(tabId, "display", {action:"showButtonOptions", config:config})
      .then(response => {
        // Handle button choice
        if (response.id == "remove") {
          utils.removeToolFromPanel(tabId, NAME);
        }
      })
      .catch(utils.errorHandler);
  }

  self.addEventListener("activate", event => {
    initializeStorage();
  });

  function trimMessages(lastPageUnloadTime) {
    utils.loadTool(NAME)
      .then(tool => {
        tool.messages = tool.messages.filter(message => message.timeInMs > lastPageUnloadTime)
        utils.writeTool(tool)
      })
      .catch(utils.errorHandler);
  }

  self.addEventListener("message", event => {
    var message = event.data;

    // Broadcasts
    switch(message.action) {
      case "initializeTools":
        initializeStorage();
        break;
      case "unload":
        trimMessages(message.time)
        break;
      default:
        break;
    }

    // Directed
    if (message.tool === NAME) {
      switch(message.action) {
        case "buttonMenuCicked":
          showOptions(message.tabId);
          break;
        default:
          break;
      }
    }
  });

  self.addEventListener("updateStorageMessages", event => {
    utils.messageAllTabs('drawer', {action: 'updateStorageMessages', messages: [message]})
      .catch(utils.errorHandler);

    tool.messages.push(message);
    utils.writeTool(tool);
  });

  return {
    name: NAME,
    initialize: initializeStorage
  };
})();

self.tools[Storage.name] = Storage;
