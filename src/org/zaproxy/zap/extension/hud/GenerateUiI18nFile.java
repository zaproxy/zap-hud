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

import java.io.File;
import java.io.FileFilter;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLClassLoader;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.ResourceBundle;

/**
 * Generates the i18n.js file used by the HUD web UI.
 * The i18n messages are held in the UIMessages* files so that they can be translated
 * via crowdin but dont have to be loaded into the ZAP Desktop UI or daemon
 */
public class GenerateUiI18nFile {
    
    private static String PREFIX = 
            "var I18n = (function() {\n" + 
            "\n" +
            "	var messages = {";
    private static String POSTFIX = 
            "	};\n" + 
            "\n" + 
            "	Vue.use(VueI18n);\n" + 
            "	var i18n = new VueI18n({\n" + 
            "		locale: '<<ZAP_LOCALE>>',\n" + 
            "		fallbackLocalelocale: 'en_GB',\n" + 
            "		messages: messages\n" + 
            "	});\n" + 
            "	new Vue({ i18n: i18n });\n" + 
            "\n" + 
            "	function i18nt (key) {\n" + 
            "		return i18n.t(\"message.\" + key);\n" + 
            "	};\n" + 
            "\n" + 
            "	function setLocale (locale) {\n" + 
            "		i18n.locale = locale;\n" + 
            "	};\n" + 
            "\n" + 
            "	return {\n" + 
            "		i18n: i18n,\n" + 
            "		t: i18nt,\n" + 
            "		setLocale: setLocale\n" + 
            "	};\n" + 
            "})();\n";

    public GenerateUiI18nFile() {
    }
    
    private static String cleanValue(String value) {
        return value.replace("'", "\\'");
    }
    
    public static void main(String[] args) throws MalformedURLException {
        File resourceDir = new File("src/org/zaproxy/zap/extension/hud/resources/");
        List<String> langs = new ArrayList<String>();
        langs.add("en_GB");
        String prefix = "UIMessages_";
        FileFilter filter = new FileFilter() {
            @Override
            public boolean accept(File f) {
                return f.getName().startsWith(prefix);
            }
            
        };
        for (final File file : resourceDir.listFiles(filter)) {
            langs.add(file.getName().substring(
                    prefix.length(), file.getName().indexOf(".properties")));
        }
        URL[] urls = {resourceDir.toURI().toURL()};
        ClassLoader loader = new URLClassLoader(urls);

        System.out.println(PREFIX);

        for (String lang : langs) {
            Locale locale;
            if (lang.indexOf("_") > 0) {
                String[] parts = lang.split("_");
                locale = new Locale(parts[0], parts[1]);
            } else {
                locale = new Locale(lang);
            }
            ResourceBundle rb = ResourceBundle.getBundle("UIMessages", locale, loader);
            ArrayList<String> keys = Collections.list(rb.getKeys());
            Collections.sort(keys);
            System.out.println("\t\t" + lang + ": {");
            System.out.println("\t\t\tmessage: {");
            
            for (String key : keys) {
                System.out.println("\t\t\t\t" + key + ": '" + 
                        cleanValue(rb.getString(key)) + "',");
            }
            System.out.println("\t\t\t}");
            System.out.println("\t\t},");
        }
        System.out.println(POSTFIX);
    }
}
