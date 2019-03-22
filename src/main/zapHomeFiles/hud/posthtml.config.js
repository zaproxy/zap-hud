module.exports = {
  plugins: {
    "posthtml-expressions": {
      locals: {
        ZAP_HUD_FILES: process.env.ZAP_HUD_FILES,
        ZAP_HUD_URL: process.env.ZAP_HUD_URL,
        ZAP_HUD_API: process.env.ZAP_HUD_API,
        ZAP_HUD_WS: process.env.ZAP_HUD_WS,
        ZAP_HUD_TOOLS: process.env.ZAP_HUD_TOOLS,
        ZAP_SHARED_SECRET: process.env.ZAP_SHARED_SECRET
      },
      delimiters: ["{{{", "}}}"]
    }
  }
};
