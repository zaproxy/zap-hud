import com.github.gradle.node.npm.task.NpmTask
import org.zaproxy.gradle.addon.AddOnStatus
import org.zaproxy.gradle.addon.internal.model.ProjectInfo
import org.zaproxy.gradle.addon.internal.model.ReleaseState
import org.zaproxy.gradle.addon.internal.tasks.GenerateReleaseStateLastCommit
import org.zaproxy.gradle.addon.misc.ConvertMarkdownToHtml
import org.zaproxy.gradle.addon.misc.CopyAddOn
import org.zaproxy.gradle.tasks.GenerateI18nJsFile
import org.zaproxy.gradle.tasks.ZapDownloadWeekly
import org.zaproxy.gradle.tasks.ZapJavaStart
import org.zaproxy.gradle.tasks.ZapShutdown
import org.zaproxy.gradle.tasks.ZapStart

plugins {
    `java-library`
    jacoco
    id("org.zaproxy.add-on") version "0.8.0"
    id("org.zaproxy.crowdin") version "0.3.1"
    id("com.diffplug.spotless") version "6.14.1"
    id("com.github.ben-manes.versions") version "0.45.0"
    id("com.github.node-gradle.node") version "3.5.1"
}

apply(from = "$rootDir/gradle/compile.gradle.kts")
apply(from = "$rootDir/gradle/ci.gradle.kts")

repositories {
    mavenCentral()
}

description = "Display information from ZAP in browser."

val generatedI18nJsFileDir = layout.buildDirectory.dir("zapAddOn/i18nJs")
val npmDepsDir = layout.buildDirectory.dir("zapAddOn/npmDeps")
val zapHome = layout.buildDirectory.dir("zapHome").get()
val testZapHome = layout.buildDirectory.dir("testZapHome").get()
val zapDownloadDir = layout.buildDirectory.dir("testZapInstall").get()
val zapInstallDir = zapDownloadDir.dir("zap")
val testResultsDir = layout.buildDirectory.dir("reports/tests/test").get()
val zapPort = 8999
// Use a key just to make sure the HUD works with one
val zapApiKey = "password123"
val hudDevArgs = listOf("-config", "hud.enabledForDesktop=true", "-config", "hud.enabledForDaemon=true", "-config", "hud.devMode=true", "-config", "hud.unsafeEval=true")
val zapCmdlineOpts = listOf("-silent", "-config", "hud.tutorialPort=9998", "-config", "hud.tutorialTestMode=true", "-config", "hud.showWelcomeScreen=false", "-daemon") + hudDevArgs

zapAddOn {
    addOnId.set("hud")
    addOnName.set("HUD - Heads Up Display")
    addOnStatus.set(AddOnStatus.BETA)

    zapVersion.set("2.12.0")

    releaseLink.set("https://github.com/zaproxy/zap-hud/compare/v@PREVIOUS_VERSION@...v@CURRENT_VERSION@")
    unreleasedLink.set("https://github.com/zaproxy/zap-hud/compare/v@CURRENT_VERSION@...HEAD")

    manifest {
        author.set("ZAP Dev Team")
        url.set("https://www.zaproxy.org/docs/desktop/addons/hud/")
        repo.set("https://github.com/zaproxy/zap-hud/")
        changesFile.set(tasks.named<ConvertMarkdownToHtml>("generateManifestChanges").flatMap { it.html })
        files.from(generatedI18nJsFileDir)
        files.from(npmDepsDir)

        dependencies {
            addOns {
                register("network") {
                    version.set(">= 0.1.0")
                }
                register("websocket")
            }
        }

        extensions {
            register("org.zaproxy.zap.extension.hud.launch.ExtensionHUDlaunch") {
                classnames {
                    allowed.set(listOf("org.zaproxy.zap.extension.hud.launch"))
                }
                dependencies {
                    addOns {
                        register("selenium") {
                            version.set("15.*")
                        }
                    }
                }
            }
        }
    }
}

crowdin {
    credentials {
        token.set(System.getenv("CROWDIN_AUTH_TOKEN"))
    }

    configuration {
        file.set(file("gradle/crowdin.yml"))
        tokens.set(mutableMapOf("%addOnId%" to zapAddOn.addOnId.get()))
    }
}

node {
    download.set(true)
    version.set("19.7.0")
}

val copyNpmDeps by tasks.registering(Copy::class) {
    group = LifecycleBasePlugin.BUILD_GROUP
    description = "Copies the (required) npm dependencies for the add-on."
    dependsOn(tasks.npmInstall)

    from("node_modules/vue/dist/vue.js")
    from("node_modules/vue-i18n/dist/vue-i18n.js")
    from("node_modules/localforage/dist/localforage.min.js")

    into(npmDepsDir.map({ it.file("hud/libraries/") }))
}

sourceSets["main"].output.dir(npmDepsDir, "builtBy" to copyNpmDeps)

val generateI18nJsFile by tasks.creating(GenerateI18nJsFile::class) {
    bundleName.set("UIMessages")
    srcDir.set(file("src/other/resources/UIMessages/"))
    i18nJsFile.set(generatedI18nJsFileDir.map({ it.file("hud/i18n.js") }))
    // In review mode all i18n messages are upper case to easily spot untranslated messages.
    reviewMode.set(false)
}

sourceSets["main"].output.dir(generatedI18nJsFileDir, "builtBy" to generateI18nJsFile)

java {
    val javaVersion = JavaVersion.VERSION_11
    sourceCompatibility = javaVersion
    targetCompatibility = javaVersion
}

val jupiterVersion = "5.9.2"

dependencies {
    compileOnly("org.zaproxy.addon:network:0.1.0")
    compileOnly(files(fileTree("lib").files))

    testImplementation("org.junit.jupiter:junit-jupiter-api:$jupiterVersion")
    testImplementation("org.junit.jupiter:junit-jupiter-params:$jupiterVersion")
    testRuntimeOnly("org.junit.jupiter:junit-jupiter-engine:$jupiterVersion")

    testImplementation("io.github.bonigarcia:selenium-jupiter:4.3.2")
    testImplementation("org.seleniumhq.selenium:selenium-java:4.7.2")
    testImplementation("org.hamcrest:hamcrest-all:1.3")
    testImplementation("org.mockito:mockito-all:1.10.19")
    testImplementation("org.zaproxy.addon:network:0.1.0")
    testImplementation(files(fileTree("lib").files))
}

tasks.withType<Test>().configureEach {
    useJUnitPlatform()
}

val jacocoReportAll by tasks.registering(JacocoReport::class) {
    executionData(tasks.named("test").get(), tasks.named("testTutorial").get(), tasks.named("zapStartTest").get())
    sourceSets(sourceSets.main.get())
}

val jacocoTestTutorialReport by tasks.registering(JacocoReport::class) {
    executionData(tasks.named("testTutorial").get(), tasks.named("zapStartTest").get())
    sourceSets(sourceSets.main.get())
}

fun sourcesWithoutLibs(extension: String) =
    fileTree("src") {
        include("**/*.$extension")
        exclude("**/hud/libraries/**")
    }

spotless {
    java {
        licenseHeaderFile("gradle/spotless/license.java")

        googleJavaFormat("1.7").aosp()
    }

    kotlinGradle {
        ktlint()
    }

    // XXX Don't check for now to not require npm to try the HUD (runZap).
    // format("css", {
    //     target(sourcesWithoutLibs("css"))
    //     prettier().config(mapOf("parser" to "css"))
    // })
}

val addOnGroup = "ZAP Add-On"

tasks.jarZapAddOn { mustRunAfter("zapDownload") }

tasks {
    register<Exec>("npmLintStagedHud") {
        description = "Runs the XO linter on the staged files."

        commandLine("npm", "run", "lint-staged")
    }

    val npmLintAllHud by registering(NpmTask::class) {
        group = LifecycleBasePlugin.VERIFICATION_GROUP
        description = "Runs the XO linter on all files."

        dependsOn(npmInstall)
        npmCommand.set(listOf("run", "lint"))
    }

    named("check") {
        dependsOn(npmLintAllHud)
    }

    register<Exec>("npmTestHud") {
        group = LifecycleBasePlugin.VERIFICATION_GROUP
        description = "Runs the ava tests."

        commandLine("npm", "test")
    }

    register<Test>("testTutorial") {
        group = LifecycleBasePlugin.VERIFICATION_GROUP
        description = "Runs the tutorial tests (ZAP must be running)."
        useJUnitPlatform {
            includeTags("tutorial")
        }
        dependsOn("zapStartTest")
    }

    register<Test>("testRemote") {
        group = LifecycleBasePlugin.VERIFICATION_GROUP
        description = "Runs the remote tests (ZAP must be running)."
        useJUnitPlatform {
            includeTags("remote")
        }
        dependsOn("zapStartTest")
    }

    register<ZapDownloadWeekly>("zapDownload") {
        group = LifecycleBasePlugin.VERIFICATION_GROUP
        description = "Downloads the latest ZAP weekly release for the unit tests"

        onlyIf { !zapInstallDir.asFile.exists() }

        into.set(zapDownloadDir.asFile)
        zapVersions.set("https://raw.githubusercontent.com/zaproxy/zap-admin/master/ZapVersions.xml")

        doLast {
            copy {
                from(zipTree(fileTree(zapDownloadDir.asFile).matching { "*.zip" }.singleFile)).eachFile {
                    path = path.substring(relativePath.segments[0].length)
                }
                into(zapInstallDir)
                includeEmptyDirs = false
            }
            delete(fileTree(zapInstallDir.dir("plugin")) { include("${zapAddOn.addOnId.get()}-*.zap") })
        }
    }

    register<Copy>("copyHudClientFiles") {
        group = addOnGroup
        description = "Copies the HUD files to runZap's home directory for use with continuous mode."

        from(file("src/main/zapHomeFiles"))
        from(sourceSets["main"].output.dirs)
        into(zapHome)
    }

    register<CopyAddOn>("copyAddOnLocalHome") {
        into(zapHome.dir("plugin"))
    }

    register<ZapStart>("runZap") {
        group = addOnGroup
        description = "Runs ZAP (weekly) with the HUD in dev mode."

        dependsOn("zapDownload", "copyAddOnLocalHome", "copyHudClientFiles")

        installDir.set(zapInstallDir.asFile)
        homeDir.set(zapHome.asFile)

        args.set(listOf("-dev", "-config", "start.checkForUpdates=false", "-config", "hud.dir=$zapHome/hud") + hudDevArgs)
    }

    register<Delete>("deleteTestHome") {
        delete(testZapHome)
    }

    register<CopyAddOn>("copyAddOnTestHome") {
        into(testZapHome.dir("plugin"))

        dependsOn("deleteTestHome")
    }

    register<ZapJavaStart>("zapStartTest") {
        group = LifecycleBasePlugin.VERIFICATION_GROUP
        description = "Starts ZAP for the tests."

        dependsOn("zapDownload", "copyAddOnTestHome")
        finalizedBy("zapStop")

        installDir.set(zapInstallDir.asFile)
        homeDir.set(testZapHome.asFile)
        port.set(zapPort)
        apiKey.set(zapApiKey)
        args.set(zapCmdlineOpts)

        jacoco.applyTo(this)
    }

    register<ZapStart>("zapStart") {
        group = LifecycleBasePlugin.VERIFICATION_GROUP
        description = "Starts ZAP for manual integration tests."

        dependsOn("zapDownload", "copyAddOnTestHome")

        installDir.set(zapInstallDir.asFile)
        homeDir.set(testZapHome.asFile)
        port.set(zapPort)
        apiKey.set(zapApiKey)
        args.set(zapCmdlineOpts)
    }

    register<ZapShutdown>("zapStop") {
        group = LifecycleBasePlugin.VERIFICATION_GROUP
        description = "Stops ZAP after the unit tests have been run"

        port.set(zapPort)
        apiKey.set(zapApiKey)

        mustRunAfter(withType<Test>())
    }

    register("zapRunTests") {
        group = LifecycleBasePlugin.VERIFICATION_GROUP
        description = "Starts ZAP, runs the tests and stops ZAP"

        dependsOn("test")
        dependsOn("testTutorial")
        // These are failing too often on travis, presumably due to timeouts?
        // dependsOn("testRemote")
    }
}

tasks.test {
    useJUnitPlatform {
        excludeTags("remote", "tutorial")
    }
}

tasks.withType<Test>().configureEach {
    systemProperties.putAll(
        mapOf(
            "wdm.chromeDriverVersion" to "83.0.4103.39",
            "wdm.geckoDriverVersion" to "0.32.1",
            "wdm.forceCache" to "true",
        ),
    )
}

val projectInfo = ProjectInfo.from(project)
val generateReleaseStateLastCommit by tasks.registering(GenerateReleaseStateLastCommit::class) {
    projects.set(listOf(projectInfo))
}

val releaseAddOn by tasks.registering {
    if (ReleaseState.read(projectInfo).isNewRelease()) {
        dependsOn("createRelease")
        dependsOn("handleRelease")
        dependsOn("createPullRequestNextDevIter")
        dependsOn("crowdinUploadSourceFiles")
    }
}
