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
package org.zaproxy.gradle;

import java.io.File;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.gradle.api.NamedDomainObjectProvider;
import org.gradle.api.Plugin;
import org.gradle.api.Project;
import org.gradle.api.artifacts.Configuration;
import org.gradle.api.artifacts.ConfigurationContainer;
import org.gradle.api.file.Directory;
import org.gradle.api.file.DirectoryProperty;
import org.gradle.api.file.FileCollection;
import org.gradle.api.plugins.JavaPlugin;
import org.gradle.api.plugins.JavaPluginConvention;
import org.gradle.api.provider.Property;
import org.gradle.api.tasks.SourceSet;
import org.gradle.api.tasks.TaskProvider;
import org.gradle.api.tasks.bundling.Jar;
import org.gradle.language.base.plugins.LifecycleBasePlugin;
import org.zaproxy.gradle.jh.JavaHelpIndexerExtension;
import org.zaproxy.gradle.jh.tasks.JavaHelpIndexer;
import org.zaproxy.gradle.tasks.CopyAddOn;
import org.zaproxy.gradle.tasks.DeployAddOn;
import org.zaproxy.gradle.tasks.UpdateManifestFile;
import org.zaproxy.gradle.zapversions.VersionsExtension;
import org.zaproxy.gradle.zapversions.tasks.GenerateZapVersionsFile;

public class AddOnPlugin implements Plugin<Project> {

    public static final String ADD_ON_GROUP = "ZAP Add-On";

    public static final String EXTENSION_NAME = "zapAddOn";

    private static final String JAVA_HELP_DEFAULT_DEPENDENCY = "javax.help:javahelp:2.0.05";

    @Override
    public void apply(Project project) {
        project.getPlugins()
                .withType(
                        JavaPlugin.class,
                        jp -> {
                            AddOnPluginExtension extension =
                                    project.getExtensions()
                                            .create(
                                                    EXTENSION_NAME,
                                                    AddOnPluginExtension.class,
                                                    project);

                            ConfigurationContainer confContainer = project.getConfigurations();

                            NamedDomainObjectProvider<Configuration> zapConfig =
                                    confContainer.register("zap");
                            zapConfig.configure(
                                    config -> {
                                        config.setVisible(false);

                                        config.defaultDependencies(
                                                deps -> {
                                                    Property<String> zapVersion =
                                                            extension.getZapVersion();
                                                    if (zapVersion.isPresent()) {
                                                        deps.add(
                                                                project.getDependencies()
                                                                        .create(
                                                                                "org.zaproxy:zap:"
                                                                                        + zapVersion
                                                                                                .get()));
                                                    }
                                                });
                                    });

                            confContainer
                                    .named(JavaPlugin.COMPILE_ONLY_CONFIGURATION_NAME)
                                    .configure(e -> e.extendsFrom(zapConfig.get()));
                            confContainer
                                    .named(JavaPlugin.TEST_IMPLEMENTATION_CONFIGURATION_NAME)
                                    .configure(e -> e.extendsFrom(zapConfig.get()));

                            setUpAddOn(project, jp, extension);
                            setUpAddOnFiles(project, extension);
                            setUpManifest(project, extension);
                            setUpJavaHelp(project, jp, extension);
                            setUpZapVersions(project, extension);
                        });
    }

    private void setUpJavaHelp(Project project, JavaPlugin jp, AddOnPluginExtension extension) {
        NamedDomainObjectProvider<Configuration> javaHelpConfig =
                project.getConfigurations().register("javahelp");
        javaHelpConfig.configure(
                conf -> {
                    conf.setVisible(false)
                            .setDescription("The data artifacts to be processed for this plugin.")
                            .defaultDependencies(
                                    deps ->
                                            deps.add(
                                                    project.getDependencies()
                                                            .create(JAVA_HELP_DEFAULT_DEPENDENCY)));
                });

        project.getTasks()
                .withType(JavaHelpIndexer.class)
                .configureEach(jhi -> jhi.getClasspath().from(javaHelpConfig));

        DirectoryProperty srcDir = project.getLayout().directoryProperty();
        srcDir.set(project.file("src/main/javahelp"));

        TaskProvider<Jar> generateAddOnProvider =
                project.getTasks().withType(Jar.class).named("assembleZapAddOn");
        generateAddOnProvider.configure(t -> t.from(srcDir));

        Directory mainDestDir = project.getLayout().getBuildDirectory().dir("jhindexes").get();

        FileCollection helpsets = project.fileTree(srcDir).filter(e -> e.getName().endsWith(".hs"));
        helpsets.forEach(
                helpset -> {
                    String prefix = helpset.getParentFile().getName();
                    Directory dir = mainDestDir.dir(prefix);

                    TaskProvider<JavaHelpIndexer> tp =
                            project.getTasks()
                                    .register("jhindexer-" + prefix, JavaHelpIndexer.class);
                    tp.configure(
                            t -> {
                                JavaHelpIndexerExtension jhiExtension = extension.getJavaHelp();
                                t.getHelpset().set(helpset);
                                t.getOutputPrefix()
                                        .set(
                                                srcDir.getAsFile()
                                                        .get()
                                                        .toPath()
                                                        .relativize(helpset.toPath().getParent())
                                                        .toString());
                                t.setSource(helpset.getParentFile());
                                t.getDestinationDir().set(dir);

                                t.getDbName().set(jhiExtension.getDbName());

                                t.setDescription("");
                                t.setGroup(LifecycleBasePlugin.BUILD_GROUP);
                            });

                    generateAddOnProvider.configure(t -> t.from(tp.get().getDestinationDir()));
                });
    }

    private void setUpAddOnFiles(Project project, AddOnPluginExtension extension) {
        DirectoryProperty srcDir = project.getLayout().directoryProperty();
        srcDir.set(project.file("src/main/zapHomeFiles"));
        extension.getZapHomeFiles().from(srcDir);

        JavaPluginConvention javaConvention =
                project.getConvention().getPlugin(JavaPluginConvention.class);
        NamedDomainObjectProvider<SourceSet> main =
                javaConvention.getSourceSets().named(SourceSet.MAIN_SOURCE_SET_NAME);
        main.configure(sourceSet -> sourceSet.getResources().srcDir(srcDir));
    }

    private void setUpManifest(Project project, AddOnPluginExtension extension) {
        TaskProvider<UpdateManifestFile> generateTaskProvider =
                project.getTasks().register("updateManifestFile", UpdateManifestFile.class);
        generateTaskProvider.configure(
                task -> {
                    task.getAddOnVersion().set(extension.getAddOnVersion());
                    task.getAddOnStatus().set(extension.getAddOnStatus());
                    task.getZapHomeFiles().from(extension.getZapHomeFiles());
                    task.getZapVersion().set(extension.getZapVersion());

                    task.setGroup(LifecycleBasePlugin.BUILD_GROUP);
                });

        JavaPluginConvention javaConvention =
                project.getConvention().getPlugin(JavaPluginConvention.class);
        NamedDomainObjectProvider<SourceSet> main =
                javaConvention.getSourceSets().named(SourceSet.MAIN_SOURCE_SET_NAME);
        main.configure(sourceSet -> sourceSet.getResources().srcDir(generateTaskProvider));
    }

    private void setUpAddOn(Project project, JavaPlugin jp, AddOnPluginExtension extension) {
        TaskProvider<Jar> generateAddOnProvider =
                project.getTasks().register("assembleZapAddOn", Jar.class);
        generateAddOnProvider.configure(
                task -> {
                    task.setDescription("Assembles the ZAP add-on.");
                    task.setGroup(LifecycleBasePlugin.BUILD_GROUP);

                    task.setBaseName(extension.getAddOnId().get());
                    task.setAppendix(extension.getAddOnStatus().get());
                    task.setVersion(extension.getAddOnVersion().get());
                    task.setExtension("zap");
                    File outputDir =
                            project.getLayout().getBuildDirectory().dir("zap").get().getAsFile();
                    task.setDestinationDir(outputDir);
                    task.getOutputs()
                            .upToDateWhen(
                                    t -> {
                                        Path dir = outputDir.toPath();
                                        if (!Files.exists(dir)) {
                                            return true;
                                        }
                                        try (Stream<Path> stream =
                                                Files.find(
                                                        dir,
                                                        1,
                                                        (p, a) ->
                                                                p.getFileName()
                                                                        .toString()
                                                                        .endsWith(".zap"))) {
                                            return stream.count() == 1;
                                        } catch (IOException e) {
                                            throw new UncheckedIOException(e);
                                        }
                                    });
                    task.doFirst(t -> project.delete(project.fileTree(outputDir).getFiles()));

                    task.setPreserveFileTimestamps(false);
                    task.setReproducibleFileOrder(true);

                    Jar jar =
                            project.getTasks()
                                    .withType(Jar.class)
                                    .named(JavaPlugin.JAR_TASK_NAME)
                                    .get();
                    task.with(jar);
                    task.getManifest().from(jar.getManifest());

                    ConfigurationContainer configurations = project.getConfigurations();
                    NamedDomainObjectProvider<Configuration> runtimeClasspath =
                            configurations.named(JavaPlugin.RUNTIME_CLASSPATH_CONFIGURATION_NAME);

                    task.from(
                                    project.provider(
                                            () ->
                                                    runtimeClasspath
                                                            .get()
                                                            .getFiles()
                                                            .stream()
                                                            .map(
                                                                    e ->
                                                                            e.isDirectory()
                                                                                    ? e
                                                                                    : project
                                                                                            .zipTree(
                                                                                                    e))
                                                            .collect(Collectors.toList())))
                            .exclude("META-INF/*.SF", "META-INF/*.DSA", "META-INF/*.RSA");
                });
        project.getTasks()
                .named(LifecycleBasePlugin.ASSEMBLE_TASK_NAME)
                .configure(t -> t.dependsOn(generateAddOnProvider));

        TaskProvider<DeployAddOn> deployProvider =
                project.getTasks().register("deploy", DeployAddOn.class);
        deployProvider.configure(
                task -> {
                    task.setGroup(ADD_ON_GROUP);
                    task.setDescription(
                            "Deploys the add-on and its home files to ZAP home dir.\n\n"
                                    + "Defaults to dev home dir if not specified through the command line nor\n"
                                    + "through the system property \"zap.home.dir\". The command line argument\n"
                                    + "takes precedence over the system property.\n"
                                    + "By default the existing home files are deleted before deploying the new\n"
                                    + "files, to prevent stale files. This behaviour can be changed through the\n"
                                    + "command line.");

                    task.dependsOn(generateAddOnProvider);
                    task.getAddOn().set(generateAddOnProvider.map(t -> t.getArchivePath()));
                    task.getFiles().from(extension.getZapHomeFiles());
                });

        TaskProvider<CopyAddOn> copyAddOnProvider =
                project.getTasks().register("copyAddOn", CopyAddOn.class);
        copyAddOnProvider.configure(
                task -> {
                    task.setGroup(ADD_ON_GROUP);
                    task.setDescription(
                            "Copies the add-on to zaproxy project (defaults to \"../zaproxy/src/plugin/\").");

                    task.from(generateAddOnProvider);
                });
    }

    private static void setUpZapVersions(Project project, AddOnPluginExtension extension) {
        TaskProvider<GenerateZapVersionsFile> tp =
                project.getTasks()
                        .register("generateZapVersionsFile", GenerateZapVersionsFile.class);
        tp.configure(
                t -> {
                    TaskProvider<Jar> addOnProvider =
                            project.getTasks().withType(Jar.class).named("assembleZapAddOn");
                    t.dependsOn(addOnProvider);

                    VersionsExtension zapVersionsExtension = extension.getVersions();
                    t.getAddOnId().set(zapVersionsExtension.getAddOnId());
                    t.getAddOn().set(addOnProvider.map(jar -> jar.getArchivePath()));
                    t.getDownloadUrl().set(zapVersionsExtension.getDownloadUrl());
                    t.getChecksumAlgorithm().set(zapVersionsExtension.getChecksumAlgorithm());
                    t.getFile().set(zapVersionsExtension.getFile());

                    t.setDescription("");
                    t.setGroup(LifecycleBasePlugin.BUILD_GROUP);
                });
        project.getTasks()
                .named(LifecycleBasePlugin.ASSEMBLE_TASK_NAME)
                .configure(t -> t.dependsOn(tp));
    }
}
