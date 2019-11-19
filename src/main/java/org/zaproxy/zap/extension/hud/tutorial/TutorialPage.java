/*
 * Zed Attack Proxy (ZAP) and its related class files.
 *
 * ZAP is an HTTP/HTTPS proxy for assessing web application security.
 *
 * Copyright 2018 The ZAP Development Team
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.zaproxy.zap.extension.hud.tutorial;

import java.security.SecureRandom;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.apache.log4j.Logger;
import org.parosproxy.paros.Constant;
import org.parosproxy.paros.network.HttpMessage;
import org.zaproxy.zap.extension.hud.tutorial.pages.IndexPage;

public abstract class TutorialPage {

    public static final String TASK_TOKEN = "<!-- TASK -->";
    public static final int TUTORIAL_ALERTS_PLUGIN_ID = 60200;

    private TutorialProxyServer tutorialProxyServer = null;
    private TutorialPage previousPage = null;
    private TutorialPage nextPage = null;
    private SecureRandom rnd = new SecureRandom();
    private Boolean hasTask;
    private String taskHtml;
    private Boolean taskCompleted = null;
    private boolean taskJustCompleted = false;
    private String key;
    private String antiCsrfToken = UUID.randomUUID().toString();

    public Logger log = Logger.getLogger(this.getClass());

    public TutorialPage(TutorialProxyServer tutorialProxyServer) {
        this.tutorialProxyServer = tutorialProxyServer;
    }

    public TutorialPage(TutorialProxyServer tutorialProxyServer, TutorialPage previousPage) {
        this.tutorialProxyServer = tutorialProxyServer;
        this.previousPage = previousPage;
        if (previousPage != null) {
            previousPage.setNextPage(this);
        }
    }

    public TutorialPage getPreviousPage() {
        return previousPage;
    }

    public void setPreviousPage(TutorialPage previousPage) {
        this.previousPage = previousPage;
    }

    public TutorialPage getNextPage() {
        return nextPage;
    }

    private void setNextPage(TutorialPage nextPage) {
        this.nextPage = nextPage;
    }

    public boolean isTaskCompleted() {
        if (this.taskCompleted == null) {
            this.taskCompleted =
                    !this.hasTask()
                            || this.getTutorialProxyServer()
                                    .getHudParam()
                                    .isTutorialTaskDone(this.getName());
        }
        return taskCompleted;
    }

    public void setTaskCompleted(boolean taskCompleted) {
        this.taskCompleted = taskCompleted;
        if (taskCompleted) {
            this.tutorialProxyServer.getHudParam().setTutorialTaskDone(this.getName());
        }
    }

    protected void setTaskJustCompleted(boolean taskJustCompleted) {
        this.taskJustCompleted = taskJustCompleted;
    }

    public String getI18nName() {
        return Constant.messages.getString("hud.tutorial.page." + this.getName().toLowerCase());
    }

    private String getTaskHtml() {
        if (this.hasTask == null && this.taskHtml == null) {
            taskHtml = tutorialProxyServer.getLocallizedTextFile(this.getName() + ".task.html");
        }
        return taskHtml;
    }

    private boolean hasTask() {
        if (this.hasTask == null) {
            this.hasTask = Boolean.valueOf(getTaskHtml() != null);
        }
        return hasTask;
    }

    public void resetTask() {
        this.taskCompleted = !this.hasTask();
    }

    public String getHtml() {
        String html = tutorialProxyServer.getLocallizedTextFile(this.getName() + ".html");
        if (html != null) {
            if (!this.tutorialProxyServer.isSkipTutorialTasks()
                    && this.hasTask()
                    && !this.isTaskCompleted()) {
                html = html.replace(TASK_TOKEN, getTaskHtml());
            } else if (this.taskJustCompleted) {
                this.taskJustCompleted = false;
                html =
                        html.replace(
                                TASK_TOKEN,
                                Constant.messages.getString("hud.tutorial.task.complete"));
            }
            html = html.replace("<!-- BUTTONS -->", this.getButtonsHtml());
            html = html.replace("<!-- CSRF -->", this.antiCsrfToken);
        } else {
            log.error("Failed to find tutorial text page: " + this.getName() + ".html");
        }
        return html;
    }

    public TutorialProxyServer getTutorialProxyServer() {
        return tutorialProxyServer;
    }

    /**
     * Returns an 8 digit random number that can be used for a tutorial task
     *
     * @return an 8 digit random number
     */
    public String setTaskToken() {
        this.key = Integer.toString(10000000 + rnd.nextInt(90000000));
        if (this.tutorialProxyServer.isTutorialTestMode()) {
            log.info("Generated key " + key);
        }
        return this.key;
    }

    /**
     * Sets a custom task token
     *
     * @param token
     */
    public void setTaskToken(String token) {
        this.key = token;
    }

    /**
     * Called when a POST request has been made. By default handles the task completion
     *
     * @param msg the HTTP message
     */
    public void handlePostRequest(HttpMessage msg, Map<String, String> params) {
        // Check to see if they've solved the task
        String body = msg.getRequestBody().toString();
        if (this.key == null || body.length() == 0) {
            // Key not set yet or no data submitted
            return;
        }
        boolean csrfOk = false;
        boolean taskOk = false;

        for (Map.Entry<String, String> entry : params.entrySet()) {
            if (entry.getKey().equals("key")) {
                log.debug("Expecting key=" + key + " got " + entry.getValue());
                if (entry.getValue().equals(key)) {
                    if (this.tutorialProxyServer.isTutorialTestMode()) {
                        log.info("Passed the task with key " + key);
                    }
                    taskOk = true;
                    taskPassed();
                } else if (this.tutorialProxyServer.isTutorialTestMode()) {
                    log.info("Unexpected key value: " + entry.getValue());
                }
            } else if (entry.getKey().equals("anticsrf")) {
                if (entry.getValue().equals(this.antiCsrfToken)) {
                    if (this.tutorialProxyServer.isTutorialTestMode()) {
                        log.info("Anticsrf token ok");
                    }
                    csrfOk = true;
                } else if (this.tutorialProxyServer.isTutorialTestMode()) {
                    log.info("Anticsrf token bad " + entry.getValue());
                }
            }
        }
        if (csrfOk && taskOk) {
            this.setTaskCompleted(true);
            this.setTaskJustCompleted(true);
        }

        if (this.tutorialProxyServer.isTutorialTestMode() && !this.taskJustCompleted) {
            log.info("Did not pass the task for key " + key);
        }
    }

    /**
     * Called when a GET request has been made. By default does nothing
     *
     * @param msg the HTTP message
     */
    public void handleGetRequest(HttpMessage msg) {
        // Default is to do nothing
    }

    /** Called when the user completes the task. */
    public void taskPassed() {
        // Default is to do nothing
    }

    public void handleResponse(HttpMessage msg) {
        // Default is to do nothing
    }

    public TutorialPage getPreviousUncompletedPage() {
        if (this.tutorialProxyServer.isSkipTutorialTasks()
                || this.tutorialProxyServer.isTutorialTestMode()) {
            return null;
        }
        TutorialPage firstUncompleted = null;
        TutorialPage page = this.previousPage;
        while (page != null) {
            if (!page.isTaskCompleted()) {
                firstUncompleted = page;
            }
            page = page.previousPage;
        }
        return firstUncompleted;
    }

    private String getButtonsHtml() {
        StringBuilder sb = new StringBuilder();
        sb.append("<div class=\"buttonsDiv\">\n");
        sb.append("<div class=\"indexDiv\">\n");
        sb.append("<a href=\"");
        sb.append(IndexPage.NAME);
        sb.append("\"><button id=\"index-button\">");
        sb.append(Constant.messages.getString("hud.tutorial.button.index"));
        if (this.getTutorialProxyServer().getHudParam().getTutorialUpdates().size() > 0) {
            sb.append(" <img src=\"exclamation-red.png\" title=\"");
            sb.append(Constant.messages.getString("hud.tutorial.hover.new"));
            sb.append("\">");
        }
        sb.append("</button></a>\n");

        sb.append("</div>\n");
        sb.append("<div class=\"prevNextDiv\">\n");
        TutorialPage page = this.getPreviousPage();
        if (page != null) {
            sb.append("<a href=\"");
            sb.append(page.getName());
            sb.append("\"><button id=\"previous-button\">");
            sb.append(Constant.messages.getString("hud.tutorial.button.previous"));
            sb.append(page.getI18nName());
            sb.append("</button></a>\n");
        }
        page = this.getNextPage();
        if (page != null) {
            if (this.isTaskCompleted() || this.tutorialProxyServer.isSkipTutorialTasks()) {
                sb.append("<a href=\"");
                sb.append(page.getName());
                sb.append("\">");
                sb.append("<button id=\"next-button\">");
            } else {
                sb.append("<button-disabled id=\"next-button\">");
            }

            sb.append(Constant.messages.getString("hud.tutorial.button.next"));
            sb.append(page.getI18nName());

            if (this.isTaskCompleted() || this.tutorialProxyServer.isSkipTutorialTasks()) {
                sb.append("</button></a>\n");
            } else {
                sb.append("</button-disabled>\n");
            }
        }
        sb.append("</div>\n");
        sb.append("</div>\n");

        return sb.toString();
    }

    protected Map<String, String> parsePostParams(HttpMessage msg) {
        Map<String, String> map = new HashMap<>();
        String body = msg.getRequestBody().toString();
        if (this.tutorialProxyServer.isTutorialTestMode()) {
            log.info("Supplied data: " + body);
        }

        for (String keyValue : body.split("\\&")) {
            int eqOffset = keyValue.indexOf('=');
            if (eqOffset > -1) {
                map.put(keyValue.substring(0, eqOffset), keyValue.substring(eqOffset + 1).trim());
            } else {
                map.put(keyValue, "");
            }
        }
        return map;
    }

    public abstract String getName();
}
