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
package org.zaproxy.gradle.zapversions.tasks;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerException;
import org.apache.commons.codec.digest.DigestUtils;
import org.apache.commons.configuration.HierarchicalConfiguration;
import org.apache.commons.configuration.XMLConfiguration;
import org.apache.commons.configuration.tree.xpath.XPathExpressionEngine;
import org.gradle.api.DefaultTask;
import org.gradle.api.model.ObjectFactory;
import org.gradle.api.provider.Property;
import org.gradle.api.tasks.Input;
import org.gradle.api.tasks.InputFile;
import org.gradle.api.tasks.OutputFile;
import org.gradle.api.tasks.PathSensitive;
import org.gradle.api.tasks.PathSensitivity;
import org.gradle.api.tasks.TaskAction;

public class GenerateZapVersionsFile extends DefaultTask {

    private static final String NAME_ELEMENT = "name";
    private static final String VERSION_ELEMENT = "version";
    private static final String SEM_VER_ELEMENT = "semver";
    private static final String DESCRIPTION_ELEMENT = "description";
    private static final String AUTHOR_ELEMENT = "author";
    private static final String URL_ELEMENT = "url";
    private static final String CHANGES_ELEMENT = "changes";
    private static final String NOT_BEFORE_VERSION_ELEMENT = "not-before-version";
    private static final String NOT_FROM_VERSION_ELEMENT = "not-from-version";

    private static final String DEPENDENCIES_ELEMENT = "dependencies";
    private static final String DEPENDENCIES_JAVA_VERSION_ELEMENT = "javaversion";
    private static final String DEPENDENCIES_ADDONS_ALL_ELEMENTS = "addons/addon";
    private static final String DEPENDENCIES_ADDONS_ALL_ELEMENTS_NO_XPATH = "addons.addon";
    private static final String ZAPADDON_ID_ELEMENT = "id";
    private static final String ZAPADDON_NOT_BEFORE_VERSION_ELEMENT = "not-before-version";
    private static final String ZAPADDON_NOT_FROM_VERSION_ELEMENT = "not-from-version";
    private static final String ZAPADDON_SEMVER_ELEMENT = "semver";

    private static final String ADD_ON_ELEMENT = "addon";
    private static final String ADD_ON_NODE = "addon_";

    private static final String FILE_ELEMENT = "file";
    private static final String STATUS_ELEMENT = "status";
    private static final String HASH_ELEMENT = "hash";
    private static final String INFO_ELEMENT = "info";
    private static final String SIZE_ELEMENT = "size";
    private static final String DATE_ELEMENT = "date";

    private final Property<String> addOnId;
    private final Property<File> addOn;
    private final Property<String> downloadUrl;
    private final Property<String> checksumAlgorithm;
    private final Property<File> file;

    public GenerateZapVersionsFile() {
        ObjectFactory objects = getProject().getObjects();
        this.addOnId = objects.property(String.class);
        this.addOn = objects.property(File.class);
        this.downloadUrl = getProject().getObjects().property(String.class);
        this.checksumAlgorithm = getProject().getObjects().property(String.class);
        this.file = objects.property(File.class);
    }

    @Input
    public Property<String> getAddOnId() {
        return addOnId;
    }

    @InputFile
    @PathSensitive(PathSensitivity.NONE)
    public Property<File> getAddOn() {
        return addOn;
    }

    @Input
    public Property<String> getDownloadUrl() {
        return downloadUrl;
    }

    @Input
    public Property<String> getChecksumAlgorithm() {
        return checksumAlgorithm;
    }

    @OutputFile
    public Property<File> getFile() {
        return file;
    }

    @TaskAction
    public void generate() throws Exception {
        File addOnFile = getAddOn().get();

        XMLConfiguration zapAddOnXml = new XMLConfiguration();
        try (ZipFile addOnZip = new ZipFile(addOnFile)) {
            ZipEntry manifestEntry = addOnZip.getEntry("ZapAddOn.xml");
            if (manifestEntry == null) {
                throw new IllegalArgumentException(
                        "The specified add-on does not have the manifest: " + addOnFile);
            }

            try (InputStream is = addOnZip.getInputStream(manifestEntry)) {
                zapAddOnXml.setEncoding("UTF-8");
                zapAddOnXml.setDelimiterParsingDisabled(true);
                zapAddOnXml.setExpressionEngine(new XPathExpressionEngine());
                zapAddOnXml.load(is);
            }
        }

        XMLConfiguration zapVersionsXml =
                new XMLConfiguration() {

                    private static final long serialVersionUID = 7018390148134058207L;

                    @Override
                    protected Transformer createTransformer() throws TransformerException {
                        Transformer transformer = super.createTransformer();
                        transformer.setOutputProperty(
                                "{http://xml.apache.org/xslt}indent-amount", "4");
                        return transformer;
                    }
                };
        zapVersionsXml.setEncoding("UTF-8");
        zapVersionsXml.setDelimiterParsingDisabled(true);
        zapVersionsXml.setRootElementName("ZAP");

        zapVersionsXml.addProperty(ADD_ON_ELEMENT, getAddOnId().get());

        String fileName = addOnFile.getName();
        String hash = createChecksum(checksumAlgorithm.get(), addOnFile);

        append(NAME_ELEMENT, zapAddOnXml, zapVersionsXml);
        append(DESCRIPTION_ELEMENT, zapAddOnXml, zapVersionsXml);
        append(AUTHOR_ELEMENT, zapAddOnXml, zapVersionsXml);
        append(VERSION_ELEMENT, zapAddOnXml, zapVersionsXml);
        append(SEM_VER_ELEMENT, zapAddOnXml, zapVersionsXml);
        appendIfNotEmpty(fileName, zapVersionsXml, getAddOnNodeKey(FILE_ELEMENT));
        append(STATUS_ELEMENT, zapAddOnXml, zapVersionsXml);
        append(CHANGES_ELEMENT, zapAddOnXml, zapVersionsXml);
        appendIfNotEmpty(
                getDownloadUrl().get() + "/" + fileName,
                zapVersionsXml,
                getAddOnNodeKey(URL_ELEMENT));
        appendIfNotEmpty(hash, zapVersionsXml, getAddOnNodeKey(HASH_ELEMENT));
        append(URL_ELEMENT, zapAddOnXml, INFO_ELEMENT, zapVersionsXml);
        appendIfNotEmpty(LocalDate.now().toString(), zapVersionsXml, getAddOnNodeKey(DATE_ELEMENT));
        appendIfNotEmpty(
                String.valueOf(addOnFile.length()), zapVersionsXml, getAddOnNodeKey(SIZE_ELEMENT));
        append(NOT_BEFORE_VERSION_ELEMENT, zapAddOnXml, zapVersionsXml);
        append(NOT_FROM_VERSION_ELEMENT, zapAddOnXml, zapVersionsXml);

        appendDependencies(zapAddOnXml, zapVersionsXml);

        zapVersionsXml.save(getFile().get());
    }

    private static String createChecksum(String algorithm, File addOnFile) throws IOException {
        return algorithm + ":" + new DigestUtils(algorithm).digestAsHex(addOnFile);
    }

    private void append(String nameElement, XMLConfiguration from, XMLConfiguration to) {
        append(nameElement, from, nameElement, to);
    }

    private void append(
            String nameElement, XMLConfiguration from, String toNameElement, XMLConfiguration to) {
        String value = from.getString(nameElement, "");
        appendIfNotEmpty(value, to, getAddOnNodeKey(toNameElement));
    }

    private void appendIfNotEmpty(String value, XMLConfiguration to, String key) {
        if (!value.isEmpty()) {
            to.setProperty(key, value);
        }
    }

    private String getAddOnNodeKey(String element) {
        return ADD_ON_NODE + addOnId.get() + "." + element;
    }

    private void appendDependencies(XMLConfiguration from, XMLConfiguration to) {
        List<HierarchicalConfiguration> dependencies = from.configurationsAt(DEPENDENCIES_ELEMENT);
        if (dependencies.isEmpty()) {
            return;
        }

        HierarchicalConfiguration node = dependencies.get(0);

        appendIfNotEmpty(
                node.getString(DEPENDENCIES_JAVA_VERSION_ELEMENT, ""),
                to,
                getAddOnNodeKey(DEPENDENCIES_ELEMENT + "." + DEPENDENCIES_JAVA_VERSION_ELEMENT));

        List<HierarchicalConfiguration> fields =
                node.configurationsAt(DEPENDENCIES_ADDONS_ALL_ELEMENTS);
        if (fields.isEmpty()) {
            return;
        }

        for (int i = 0, size = fields.size(); i < size; ++i) {
            String elementBaseKey =
                    getAddOnNodeKey(
                                    DEPENDENCIES_ELEMENT
                                            + "."
                                            + DEPENDENCIES_ADDONS_ALL_ELEMENTS_NO_XPATH)
                            + "("
                            + i
                            + ").";

            HierarchicalConfiguration sub = fields.get(i);

            appendIfNotEmpty(
                    sub.getString(ZAPADDON_ID_ELEMENT, ""),
                    to,
                    elementBaseKey + ZAPADDON_ID_ELEMENT);
            appendIfNotEmpty(
                    sub.getString(ZAPADDON_SEMVER_ELEMENT, ""),
                    to,
                    elementBaseKey + ZAPADDON_SEMVER_ELEMENT);
            appendIfNotEmpty(
                    sub.getString(ZAPADDON_NOT_BEFORE_VERSION_ELEMENT, ""),
                    to,
                    elementBaseKey + ZAPADDON_NOT_BEFORE_VERSION_ELEMENT);
            appendIfNotEmpty(
                    sub.getString(ZAPADDON_NOT_FROM_VERSION_ELEMENT, ""),
                    to,
                    elementBaseKey + ZAPADDON_NOT_FROM_VERSION_ELEMENT);
        }
    }
}
