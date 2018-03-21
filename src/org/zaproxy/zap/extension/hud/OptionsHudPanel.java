/*
 * Zed Attack Proxy (ZAP) and its related class files.
 *
 * ZAP is an HTTP/HTTPS proxy for assessing web application security.
 *
 * Copyright 2017 The ZAP Development Team
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

import java.awt.FlowLayout;
import java.awt.GridBagLayout;
import java.awt.Insets;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.io.File;

import javax.swing.JButton;
import javax.swing.JCheckBox;
import javax.swing.JFileChooser;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JTextField;
import javax.swing.border.EmptyBorder;

import org.parosproxy.paros.Constant;
import org.parosproxy.paros.model.OptionsParam;
import org.parosproxy.paros.view.AbstractParamPanel;
import org.zaproxy.zap.ZAP;
import org.zaproxy.zap.eventBus.Event;
import org.zaproxy.zap.view.LayoutHelper;

/**
 * The HUD options panel.
 */
public class OptionsHudPanel extends AbstractParamPanel {

    private static final long serialVersionUID = -1L;

    /**
     * The name of the options panel.
     */
    private static final String NAME = Constant.messages.getString("hud.optionspanel.name");

    private JTextField baseDirectory;
    private JCheckBox inScopeOnly = null;
    private JCheckBox developmentMode = null;
    private JCheckBox allowUnsafeEval = null;

    public OptionsHudPanel() {
        super();
        setName(NAME);

        setLayout(new FlowLayout(FlowLayout.LEADING, 0, 0));

        JPanel panel = new JPanel(new GridBagLayout());
        panel.setBorder(new EmptyBorder(2, 2, 2, 2));

        JButton directoryButton = new JButton(Constant.messages.getString("hud.optionspanel.button.baseDirectory"));
        directoryButton.addActionListener(new FileChooserAction(getBaseDirectory()));
        JLabel directoryLabel = new JLabel(Constant.messages.getString("hud.optionspanel.label.baseDirectory"));
        directoryLabel.setLabelFor(directoryButton);
        JPanel overridesPanel = new JPanel(new FlowLayout(FlowLayout.LEADING, 0, 0));
        overridesPanel.add(getBaseDirectory());
        overridesPanel.add(directoryButton);

        panel.add(directoryLabel, LayoutHelper.getGBC(0, 0, 1, 1.0, new Insets(2, 2, 2, 2)));
        panel.add(overridesPanel, LayoutHelper.getGBC(1, 0, 1, 1.0, new Insets(2, 2, 2, 2)));
        panel.add(getInScopeOnly(), LayoutHelper.getGBC(0, 1, 2, 1.0));
        panel.add(getDevelopmentMode(), LayoutHelper.getGBC(0, 2, 2, 1.0));
        panel.add(getAllowUnsafeEval(), LayoutHelper.getGBC(0, 3, 2, 1.0));

        add(panel);
    }

    private JTextField getBaseDirectory() {
        if (baseDirectory == null) {
            baseDirectory = new JTextField(20);
        }
        return baseDirectory;
    }

    private JCheckBox getInScopeOnly() {
        if (inScopeOnly == null) {
            inScopeOnly = new JCheckBox(Constant.messages.getString("hud.optionspanel.label.inScopeOnly"));
        }
        return inScopeOnly;
    }

    
    private JCheckBox getDevelopmentMode() {
        if (developmentMode == null) {
            developmentMode = new JCheckBox(Constant.messages.getString("hud.optionspanel.label.developmentMode"));
            developmentMode.addActionListener(new ActionListener() {

                @Override
                public void actionPerformed(ActionEvent event) {
                    getAllowUnsafeEval().setEnabled(developmentMode.isSelected());
                }});
        }
        return developmentMode;
    }

    
    private JCheckBox getAllowUnsafeEval() {
        if (allowUnsafeEval == null) {
            allowUnsafeEval = new JCheckBox(Constant.messages.getString("hud.optionspanel.label.allowUnsafeEval"));
        }
        return allowUnsafeEval;
    }

    @Override
    public void initParam(Object obj) {
        final OptionsParam options = (OptionsParam) obj;
        final HudParam param = options.getParamSet(HudParam.class);

        getBaseDirectory().setText(param.getBaseDirectory());
        getInScopeOnly().setSelected(param.isInScopeOnly());
        getDevelopmentMode().setSelected(param.isDevelopmentMode());
        getAllowUnsafeEval().setSelected(param.isAllowUnsafeEval());
        getAllowUnsafeEval().setEnabled(developmentMode.isSelected());
    }

    @Override
    public void validateParam(Object obj) throws Exception {
        String filename = this.getBaseDirectory().getText();
        if (filename != null && filename.length() > 0) {
            File file = new File(filename);
            if (!file.isDirectory() || !file.canRead()) {
                throw new IllegalArgumentException(Constant.messages.getString("hud.optionspanel.warn.badBaseDir"));
            }
        }
    }

    @Override
    public void saveParam(Object obj) throws Exception {
        final OptionsParam options = (OptionsParam) obj;
        final HudParam param = options.getParamSet(HudParam.class);
        
        // Raise any relevant events before saving
        if (param.isDevelopmentMode() != getDevelopmentMode().isSelected()) {
            String event;
            if (getDevelopmentMode().isSelected()) {
                event = HudEventPublisher.EVENT_DEV_MODE_ENABLED;
            } else {
                event = HudEventPublisher.EVENT_DEV_MODE_DISABLED;
            }
            ZAP.getEventBus().publishSyncEvent(
                    HudEventPublisher.getPublisher(),
                    new Event(HudEventPublisher.getPublisher(), event, null));
        }

        param.setBaseDirectory(getBaseDirectory().getText());
        param.setInScopeOnly(getInScopeOnly().isSelected());
        param.setDevelopmentMode(getDevelopmentMode().isSelected());
        param.setAllowUnsafeEval(getAllowUnsafeEval().isSelected());
    }

    @Override
    public String getHelpIndex() {
        // TODO  add help
        //return "addon.hud.options";
        return null;
    }

    private static class FileChooserAction implements ActionListener {

        private final JTextField textField;

        public FileChooserAction(JTextField bindTextField) {
            this.textField = bindTextField;
        }

        @Override
        public void actionPerformed(ActionEvent e) {
            JFileChooser fileChooser = new JFileChooser();
            fileChooser.setFileSelectionMode(JFileChooser.DIRECTORIES_ONLY);
            String path = textField.getText();
            if (path != null) {
                File file = new File(path);
                if (file.canRead() && file.isDirectory() && file.getName().equals(ExtensionHUD.DIRECTORY_NAME)) {
                    fileChooser.setSelectedFile(file);
                }
            }
            if (fileChooser.showOpenDialog(null) == JFileChooser.APPROVE_OPTION) {
                final File selectedFile = fileChooser.getSelectedFile();

                textField.setText(selectedFile.getAbsolutePath());
            }
        }
    }
}