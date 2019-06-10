import org.zaproxy.gradle.addon.AddOnPlugin
import org.zaproxy.gradle.addon.AddOnStatus
import org.zaproxy.gradle.addon.misc.ConvertMarkdownToHtml
import org.zaproxy.gradle.addon.misc.CreateGitHubRelease
import org.zaproxy.gradle.addon.misc.CopyAddOn
import org.zaproxy.gradle.addon.misc.ExtractLatestChangesFromChangelog
import org.zaproxy.gradle.tasks.GenerateI18nJsFile
import org.zaproxy.gradle.tasks.ZapDownloadWeekly
import org.zaproxy.gradle.tasks.ZapStart
import org.zaproxy.gradle.tasks.ZapShutdown

plugins {
    `java-library`
    id("org.zaproxy.add-on") version "0.2.0"
    id("com.diffplug.gradle.spotless") version "3.15.0"
}

apply(from = "$rootDir/gradle/compile.gradle.kts")
apply(from = "$rootDir/gradle/travis-ci.gradle.kts")

repositories {
    mavenLocal()
    mavenCentral()
}

version = "0.5.0"
description = "Display information from ZAP in browser."

val generatedI18nJsFileDir = layout.buildDirectory.dir("zapAddOn/i18nJs")
val zapHome = layout.buildDirectory.dir("zapHome").get()
val testZapHome = layout.buildDirectory.dir("testZapHome").get()
val zapDownloadDir = layout.buildDirectory.dir("testZapInstall").get()
val zapInstallDir = zapDownloadDir.dir("zap")
val testResultsDir = layout.buildDirectory.dir("reports/tests/test").get()
val zapPort = 8999
// Use a key just to make sure the HUD works with one
val zapApiKey = "password123"
val hudDevArgs = listOf("-config", "hud.enabledForDesktop=true", "-config", "hud.enabledForDaemon=true", "-config", "hud.devMode=true", "-config", "hud.unsafeEval=true")
val zapCmdlineOpts = listOf("-config", "hud.tutorialPort=9998", "-config", "hud.tutorialTestMode=true", "-config", "hud.showWelcomeScreen=false", "-daemon") + hudDevArgs

zapAddOn {
    addOnId.set("hud")
    addOnName.set("HUD - Heads Up Display")
    addOnStatus.set(AddOnStatus.BETA)

    zapVersion.set("2.8.0")

    releaseLink.set("https://github.com/zaproxy/zap-hud/compare/v@PREVIOUS_VERSION@...v@CURRENT_VERSION@")
    unreleasedLink.set("https://github.com/zaproxy/zap-hud/compare/v@CURRENT_VERSION@...HEAD")

    manifest {
        author.set("ZAP Dev Team")
        changesFile.set(tasks.named<ConvertMarkdownToHtml>("generateManifestChanges").flatMap { it.html })
        files.from(generatedI18nJsFileDir)

        dependencies {
            addOns {
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

val generateI18nJsFile by tasks.creating(GenerateI18nJsFile::class) {
    bundleName.set("UIMessages")
    srcDir.set(file("src/other/resources/UIMessages/"))
    i18nJsFile.set(generatedI18nJsFileDir.map({ it.file("hud/i18n.js") }))
    // In review mode all i18n messages are upper case to easily spot untranslated messages.
    reviewMode.set(false)
}

sourceSets["main"].output.dir(generatedI18nJsFileDir, "builtBy" to generateI18nJsFile)

java {
    sourceCompatibility = JavaVersion.VERSION_1_8
    targetCompatibility = JavaVersion.VERSION_1_8
}

val jupiterVersion = "5.3.1"

dependencies {
    zap("org.zaproxy:zap:2.7.0")

    compileOnly(files(fileTree("lib").files))

    testImplementation("org.junit.jupiter:junit-jupiter-api:$jupiterVersion")
    testImplementation("org.junit.jupiter:junit-jupiter-params:$jupiterVersion")
    testRuntimeOnly("org.junit.jupiter:junit-jupiter-engine:$jupiterVersion")

    testImplementation("io.github.bonigarcia:selenium-jupiter:2.2.0")
}

tasks.withType<Test>().configureEach {
    useJUnitPlatform()
}

fun sourcesWithoutLibs(extension: String) =
        fileTree("src") {
            include("**/*.$extension")
            exclude("**/hud/libraries/**")
        }

spotless {
    java {
        licenseHeaderFile("gradle/spotless/license.java")

        googleJavaFormat().aosp()
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

    register<Exec>("npmLintAllHud") {
        description = "Runs the XO linter on all files."

        commandLine("npm", "run", "lint")
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
    }

    register<Test>("testRemote") { 
        group = LifecycleBasePlugin.VERIFICATION_GROUP
        description = "Runs the remote tests (ZAP must be running)."
        useJUnitPlatform { 
            includeTags("remote") 
        } 
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

    register<CopyAddOn>("copyAddOnTestHome") {
        into(testZapHome.dir("plugin"))

        doFirst {
            delete(testZapHome)
        }
    }

    register<ZapStart>("zapStart") {
        group = LifecycleBasePlugin.VERIFICATION_GROUP
        description = "Starts ZAP for the unit tests"
        
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

        shouldRunAfter("test")
    }
    
    register("zapRunTests") {
        group = LifecycleBasePlugin.VERIFICATION_GROUP
        description = "Starts ZAP, runs the tests and stops ZAP"
        
        dependsOn("zapStart")
        dependsOn("test")
        dependsOn("testTutorial")
        // These are failing too often on travis, presumably due to timeouts?
        // dependsOn("testRemote")
        dependsOn("zapStop")
    }

}

tasks.test { 
    shouldRunAfter("zapStart")
    useJUnitPlatform { 
        excludeTags("remote", "tutorial") 
    }  
}

tasks.withType<Test>().configureEach {
    systemProperties.putAll(mapOf(
            "wdm.chromeDriverVersion" to "2.46",
            "wdm.geckoDriverVersion" to "0.24.0",
            "wdm.forceCache" to "true"))
}

System.getenv("GITHUB_REF")?.let { ref ->
    if ("refs/tags/" !in ref) {
        return@let
    }

    tasks.register<CreateGitHubRelease>("createReleaseFromGitHubRef") {
        val targetTag = ref.removePrefix("refs/tags/")
        val targetAddOnVersion = targetTag.removePrefix("v")

        authToken.set(System.getenv("GITHUB_TOKEN"))
        repo.set(System.getenv("GITHUB_REPOSITORY"))
        tag.set(targetTag)

        title.set(provider { "v${zapAddOn.addOnVersion.get()}" })
        bodyFile.set(tasks.named<ExtractLatestChangesFromChangelog>("extractLatestChanges").flatMap { it.latestChanges })

        assets {
            register("add-on") {
                file.set(tasks.named<Jar>(AddOnPlugin.JAR_ZAP_ADD_ON_TASK_NAME).flatMap { it.archiveFile })
            }
        }

        doFirst {
            val addOnVersion = zapAddOn.addOnVersion.get()
            require(addOnVersion == targetAddOnVersion) {
                "Version of the tag $targetAddOnVersion does not match the version of the add-on $addOnVersion"
            }
        }
    }
}
