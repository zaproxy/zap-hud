import org.zaproxy.gradle.tasks.GenerateI18nJsFile
import org.zaproxy.gradle.tasks.UpdateManifestFile
import org.w3c.dom.Document
import org.w3c.dom.Element
import org.w3c.dom.Node
import org.w3c.dom.NodeList
import java.io.File
import java.net.URL
import java.util.Scanner
import javax.xml.parsers.DocumentBuilderFactory
import javax.xml.xpath.XPathConstants
import javax.xml.xpath.XPathFactory

plugins {
    `java-library`
    id("zap-add-on")
    id("com.diffplug.gradle.spotless") version "3.15.0"
}

apply(from = "$rootDir/gradle/compile.gradle.kts")

repositories {
    mavenLocal()
    mavenCentral()
}

status = "alpha"
version = "0.1.0"

val genHudFilesDir = layout.buildDirectory.dir("genHudFiles").get()
val generatedI18nJsFileDir = genHudFilesDir.dir("i18nJs")
val zapHome = layout.buildDirectory.dir("zapHome").get()
val testZapHome = layout.buildDirectory.dir("testZapHome").get()
val testZapInstall = layout.buildDirectory.dir("testZapInstall").get()
val testResultsDir = layout.buildDirectory.dir("reports/tests/test").get()
val zapPort = 8999
// Use a key just to make sure the HUD works with one
val zapApiKey = "password123"
val hudDevArgs = "-config hud.enabledForDesktop=true -config hud.enabledForDaemon=true -config hud.devMode=true -config hud.unsafeEval=true"
val zapCmdlineOpts = "-dir $testZapHome $hudDevArgs -config hud.tutorialPort=9998 -config hud.tutorialTestMode=true -config hud.showWelcomeScreen=false -config api.key=$zapApiKey -daemon -config start.addonDirs=$buildDir/zap/"
val zapSleepAfterStart = 10L

zapAddOn {
    addOnId.set("hud")
    addOnStatus.set("$status")
    zapHomeFiles.from(generatedI18nJsFileDir)

    zapVersion.set("2.8.0")
}

tasks.named<UpdateManifestFile>("updateManifestFile") {
    baseManifest.set(file("src/other/resources/ZapAddOn.xml"))
    outputDir.set(genHudFilesDir.dir("manifest"))
}

val generateI18nJsFile by tasks.creating(GenerateI18nJsFile::class) {
    bundleName.set("UIMessages")
    srcDir.set(file("src/other/resources/UIMessages/"))
    i18nJsFile.set(file(generatedI18nJsFileDir.file("hud/i18n.js")))
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

    format("css", {
        target(sourcesWithoutLibs("css"))
        prettier().config(mapOf("parser" to "css"))
    })
}

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
        group = "Verification"
        description = "Runs the tutorial tests (ZAP must be running)."
        useJUnitPlatform { 
            includeTags("tutorial") 
        } 
    }

    register<Test>("testRemote") { 
        group = "Verification"
        description = "Runs the remote tests (ZAP must be running)."
        useJUnitPlatform { 
            includeTags("remote") 
        } 
    }

    register("zapDownload") {
        group = "Verification"
        description = "Downloads the latest ZAP weekly release for the unit tests"
    
        doLast {
            mkdir(testZapInstall)
            // Extract url from versions url
            val zapvUrl = "https://raw.githubusercontent.com/zaproxy/zap-admin/master/ZapVersions.xml"
            val xmlDoc: Document = DocumentBuilderFactory.newInstance().newDocumentBuilder().parse(zapvUrl)
            val xpFactory = XPathFactory.newInstance()
            val xPath = xpFactory.newXPath()
            val xpath = "/ZAP/core/daily/url"
            val elementNodeList = xPath.evaluate(xpath, xmlDoc, XPathConstants.NODESET) as NodeList
            val weeklyUrl = elementNodeList.item(0).getTextContent()
             
            // Download and extract file
            val fileName = weeklyUrl.substring(weeklyUrl.lastIndexOf('/') + 1);
            // fileName is of the form ZAP_WEEKLY_D-2018-10-16.zip
            val day = fileName.substring(13, 23);
            ant.withGroovyBuilder {
                "get"("src" to weeklyUrl, "dest" to "$testZapInstall", "skipexisting" to "true")
                  "unzip"("src" to "$testZapInstall/$fileName", "dest" to testZapInstall)
                  // Rename the dir so we'll always know where it is
                  "move"("file" to "$testZapInstall/ZAP_D-" + day, "tofile" to "$testZapInstall/zap")
                  Runtime.getRuntime().exec("chmod +x " + "$testZapInstall/zap/zap.sh")
            }        
        }
    }

    register<Copy>("copyHudClientFiles") {
        description = "Copies the HUD files to the (local) home directory for use with continuous mode."

        from(file("src/main/zapHomeFiles"))
        from(sourceSets["main"].output.dirs)
        into(zapHome)
    }

    register("runZap") {
        description = "Runs ZAP (weekly) with the HUD in dev mode."

        if (!file("$testZapInstall/zap").exists()) {
            dependsOn("zapDownload")
        }
        dependsOn("assembleZapAddOn", "copyHudClientFiles")

        doLast {
            val args = "-dir $zapHome -dev -config start.checkForUpdates=false -config start.addonDirs=$buildDir/zap/ $hudDevArgs -config hud.dir=$zapHome/hud"
            Runtime.getRuntime().exec("$testZapInstall/zap/zap.sh $args")
        }
    }

    register("zapStart") {
        group = LifecycleBasePlugin.VERIFICATION_GROUP
        description = "Starts ZAP for the unit tests"
        
        mustRunAfter("zapDownload")
        dependsOn("assembleZapAddOn")
    
        doLast {
            delete(testZapHome)
            Runtime.getRuntime().exec("pwd")
            System.out.println("Starting ZAP")
            Runtime.getRuntime().exec("$testZapInstall/zap/zap.sh -port " + zapPort + " " + zapCmdlineOpts)
            Thread.sleep(zapSleepAfterStart * 1000)
            System.out.println("Started ZAP")
        }
    }
    
    register("zapStop") {
        group = LifecycleBasePlugin.VERIFICATION_GROUP
        description = "Stops ZAP after the unit tests have been run"
        
        shouldRunAfter("test")
    
        doLast {
            System.out.println("Stopping ZAP")
            Runtime.getRuntime().exec("curl http://localhost:" + zapPort + "/JSON/core/action/shutdown/?apikey=" + zapApiKey)
        }
    }
    
    tasks.create("zapRunTests") {
        group = LifecycleBasePlugin.VERIFICATION_GROUP
        description = "Starts ZAP, runs the tests and stops ZAP"
        
        dependsOn("zapStart")
        dependsOn("test")
        dependsOn("testTutorial")
        // These are failing too often on travis, presumably due to timeouts?
        // dependsOn("testRemote")
        dependsOn("zapStop")
    }

    register<Exec>("catFirefoxTestReport") {
        group = LifecycleBasePlugin.VERIFICATION_GROUP
        description = "Outputs the Firefox html unit test report to stdout."

        commandLine("cat", "$testResultsDir/classes/org.zaproxy.zap.extension.hud.ui.specific.ExampleDotComFirefoxUnitTest.html")
    }

    register<Exec>("catZapLog") {
        group = LifecycleBasePlugin.VERIFICATION_GROUP
        description = "Outputs the zap.log file to stdout."

        commandLine("cat", "$testZapHome/zap.log")
    }
}

tasks.named<Test>("test") { 
    shouldRunAfter("zapStart")
    useJUnitPlatform { 
        excludeTags("remote", "tutorial") 
    }  
}

tasks.withType(Test::class).configureEach {
    systemProperties.putAll(mapOf(
            "wdm.chromeDriverVersion" to "2.44",
            "wdm.geckoDriverVersion" to "0.23.0",
            "wdm.forceCache" to "true"))
}
