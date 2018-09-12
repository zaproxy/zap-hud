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

import static org.junit.Assert.assertEquals;
import static org.mockito.BDDMockito.given;
import static org.mockito.Matchers.anyObject;
import static org.mockito.Matchers.anyString;

import java.util.Locale;

import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.ClassRule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;
import org.mockito.Mockito;
import org.parosproxy.paros.Constant;
import org.parosproxy.paros.control.Control;
import org.parosproxy.paros.extension.ExtensionLoader;
import org.zaproxy.zap.utils.I18N;

/**
 * Unit test for {@link HtmlEditor}.
 */
public class APIUnitTest {

    @ClassRule
    public static TemporaryFolder tempDir = new TemporaryFolder();
    private static String zapInstallDir;
    private static String zapHomeDir;

    @BeforeClass
    public static void beforeClass() throws Exception {
        zapInstallDir = tempDir.newFolder("install").getAbsolutePath();
        zapHomeDir = tempDir.newFolder("home").getAbsolutePath();
    }

    @Before
    public void setUp() throws Exception {
        Constant.setZapInstall(zapInstallDir);
        Constant.setZapHome(zapHomeDir);

        ExtensionLoader extLoader = Mockito.mock(ExtensionLoader.class);
        Control control = Mockito.mock(Control.class);
        Mockito.when (control.getExtensionLoader()).thenReturn(extLoader);

        // Init all the things
        //Constant.getInstance();
        I18N i18n = Mockito.mock(I18N.class);
        given(i18n.getString("i18n")).willReturn("Internationalized");
        given(i18n.getString("str1")).willReturn("First string");
        given(i18n.getString("str2")).willReturn("Second string");
        given(i18n.getString("str3")).willReturn("Third string");
        given(i18n.getString(anyString(), anyObject())).willReturn("");
        given(i18n.getLocal()).willReturn(Locale.getDefault());
        given(i18n.containsKey(anyString())).willReturn(true);
        Constant.messages = i18n;

    }

    @Test
    public void testNoI18nStrings() {
        String str = "This is a string with no i18n content";
        String result = HudAPI.internationalize(str);
        assertEquals(str, result);
    }
    
    
    @Test
    public void testOneI18nString() {
        String str = "This contains just one <<ZAP_I18N_i18n>> message";
        String expected = "This contains just one Internationalized message";
        String result = HudAPI.internationalize(str);
        System.out.println("Result: " + result);
        assertEquals(expected, result);
    }

    
    @Test
    public void testTwoI18nStrings() {
        String str = "This contains <<ZAP_I18N_str1>> and <<ZAP_I18N_str2>>.";
        String expected = "This contains First string and Second string.";
        String result = HudAPI.internationalize(str);
        System.out.println("Result: " + result);
        assertEquals(expected, result);
    }
}
