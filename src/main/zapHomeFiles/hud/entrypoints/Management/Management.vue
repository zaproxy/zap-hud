<template id="welcome-screen-template">
  <div class="welcome-div">
    <img class="welcome-image" src='{{ ZAP_HUD_FILES }}?image=hud-welcome.png'>
    <div class="tutorial-div">
      <button class="btn btn-primary" @click="continueToTutorial"> Take the HUD Tutorial </button>
    </div>
    <div class="target-div">
      <button class="btn btn-primary" @click="closeWelcomeScreen"> Continue to your target </button>
    </div>
    <div class="dontShowAgain-div">
      <input type="checkbox" id="dontShowAgain" v-model="dontShowAgain">
      <label for="dontShowAgain">Don't show this screen again</label>
    </div>
  </div>
</template>

<script>
  let startTime = new Date().getTime();

  // Injected strings
  // TODO: Seek clarity on TUTORIAL_URL
  // var TUTORIAL_URL = '<<TUTORIAL_URL>>';
  const TUTORIAL_URL = `${process.env.TUTORIAL_URL}`;

  // TODO: Convert params to props
	let params = new URL(document.location).searchParams;

  const frameId = params.get('frameId');
  const context = {
    url: document.referrer,
    domain: utils.parseDomainFromUrl(document.referrer)
  };

  // TODO: Add this method to Vue methods
  function showTutorial() {
    window.open(TUTORIAL_URL);

  }

  export default {
    template: '#welcome-screen-template',
    props: [],
    methods: {
      continueToTutorial: function() {
        showTutorial();
        this.closeWelcomeScreen();
      },
      closeWelcomeScreen: function() {
        if (dontShowAgain.checked) {
          navigator.serviceWorker.controller.postMessage({
            action:"zapApiCall", component: "hud", type: "action", 
            name: "setOptionShowWelcomeScreen",
            params: { Boolean: 'false' }});
        }

        app.showWelcomeScreen = false;
        parent.postMessage( {action: 'contractManagement'} , document.referrer);
      }
    },
    data() {
      return {
        dontShowAgain: false
      }
    }
  }
</script>

<style lang="scss" scoped>
  @import '../../scss/variables.scss';

  body {
    background: none transparent;
  }

  .welcome-div {
    margin: 0 auto;
    position: relative;
    width: 791px;
  }

  .welcome-msg {
    margin: 0 auto;
    position: absolute;
    top: 50%;
  }

  .welcome-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .tutorial-div {
    margin: 0 auto;
    position: absolute;
    top: 60%;
    left: 10%;
  }

  .target-div {
    margin: 0 auto;
    position: absolute;
    top: 60%;
    right: 10%;
  }

  .dontShowAgain-div {
    margin: 0 auto;
    position: absolute;
    top: 80%;
    left: 10%;
  }
</style>