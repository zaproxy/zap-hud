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
package org.zaproxy.zap.extension.hud;

import org.zaproxy.zap.ZAP;
import org.zaproxy.zap.eventBus.EventPublisher;

public class HudEventPublisher implements EventPublisher {

    private static HudEventPublisher publisher = null;
    public static final String EVENT_ENABLED_FOR_DESKTOP = "desktop.enabled";
    public static final String EVENT_DISABLED_FOR_DESKTOP = "desktop.disabled";
    public static final String EVENT_ENABLED_FOR_DAEMON = "daemon.enabled";
    public static final String EVENT_DISABLED_FOR_DAEMON = "daemon.disabled";
    public static final String EVENT_DEV_MODE_ENABLED = "devMode.enabled";
    public static final String EVENT_DEV_MODE_DISABLED = "devMode.disabled";
    public static final String EVENT_DOMAIN_UPGRADED_TO_HTTPS = "domain.upgraded";
    public static final String EVENT_DOMAIN_REDIRECTED_TO_HTTPS = "domain.redirected";

    public static final String FIELD_DOMAIN = "domain";

    @Override
    public String getPublisherName() {
        return HudEventPublisher.class.getCanonicalName();
    }

    public static synchronized HudEventPublisher getPublisher() {
        if (publisher == null) {
            publisher = new HudEventPublisher();
            ZAP.getEventBus()
                    .registerPublisher(
                            publisher,
                            EVENT_ENABLED_FOR_DESKTOP,
                            EVENT_DISABLED_FOR_DESKTOP,
                            EVENT_ENABLED_FOR_DAEMON,
                            EVENT_DISABLED_FOR_DAEMON,
                            EVENT_DEV_MODE_ENABLED,
                            EVENT_DEV_MODE_DISABLED,
                            EVENT_DOMAIN_UPGRADED_TO_HTTPS,
                            EVENT_DOMAIN_REDIRECTED_TO_HTTPS);
        }
        return publisher;
    }

    static synchronized void unregister() {
        if (publisher != null) {
            ZAP.getEventBus().unregisterPublisher(publisher);
        }
    }
}
