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

import java.util.stream.Collectors;
import org.gradle.api.NamedDomainObjectProvider;
import org.gradle.api.Plugin;
import org.gradle.api.Project;
import org.gradle.api.artifacts.Configuration;
import org.gradle.api.artifacts.ConfigurationContainer;
import org.gradle.api.file.DirectoryProperty;
import org.gradle.api.plugins.JavaPlugin;
import org.gradle.api.plugins.JavaPluginConvention;
import org.gradle.api.provider.Property;
import org.gradle.api.tasks.Copy;
import org.gradle.api.tasks.Delete;
import org.gradle.api.tasks.SourceSet;
import org.gradle.api.tasks.TaskProvider;
import org.gradle.api.tasks.bundling.Jar;
import org.gradle.language.base.plugins.LifecycleBasePlugin;
import org.zaproxy.gradle.tasks.UpdateManifestFile;

public class AddOnPlugin implements Plugin<Project> {

    public static final String EXTENSION_NAME = "zapAddOn";

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
                    task.setDestinationDir(
                            project.getLayout().getBuildDirectory().dir("zap").get().getAsFile());

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

        TaskProvider<Copy> deployZapAddOnProvider =
                project.getTasks().register("deployZapAddOn", Copy.class);
        deployZapAddOnProvider.configure(
                task -> {
                    task.setGroup("ZAP Add-On");
                    task.setDescription(
                            "Deploys the ZAP add-on to zaproxy project (\"src/plugin\" dir).");
                    task.from(generateAddOnProvider);
                    task.setDestinationDir(project.file("../zaproxy/src/plugin"));
                });

        TaskProvider<Delete> deployZapAddOnAndResetHudProvider =
                project.getTasks().register("deployAndResetHud", Delete.class);
        deployZapAddOnAndResetHudProvider.configure(
                task -> {
                    task.setGroup("ZAP Add-On");
                    task.setDescription(
                            "Deploys the ZAP add-on to zaproxy project (\"src/plugin\" dir) and deletes the hud dir (\".ZAP_D/hud\").");
                    task.delete(System.getProperty("user.home") + "/.ZAP_D/hud");
                    task.dependsOn(deployZapAddOnProvider);
                });
    }
}
