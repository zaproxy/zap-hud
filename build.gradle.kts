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
version = "1"

val genHudFilesDir = layout.buildDirectory.dir("genHudFiles").get()
val generatedI18nJsFileDir = genHudFilesDir.dir("i18nJs")
val testZapHome = layout.buildDirectory.dir("testZapHome").get()
val testZapInstall = layout.buildDirectory.dir("testZapInstall").get()
val testResultsDir = layout.buildDirectory.dir("reports/tests/test").get()
val zapPort = 8999
// Use a key just to make sure the HUD works with one
val zapApiKey = "password123"
val zapCmdlineOpts = "-dir " + testZapHome + " -config hud.enabled=true -config hud.devMode=true -config hud.unsafeEval=true -config hud.tutorialPort=9998 -config api.key=" + zapApiKey + " -daemon"
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

spotless {
    java {
        licenseHeaderFile("gradle/spotless/license.java")

        googleJavaFormat().aosp()
    }
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
    
    register<Copy>("deployAddOnTestZapBroken") {
        // This should be the right way to deploy the HUD to the test dir, but on travis is wipes the plugins dir :/
        from(tasks.named("assembleZapAddOn"))
        into(file("$testZapInstall/zap/plugin/"))
    }

    register<Exec>("deployAddOnTestZap") {
        group = LifecycleBasePlugin.VERIFICATION_GROUP
        description = "Copy HUD plugin via the cmdline, as the proper task seems to clear the plugins dir on travis."

        mustRunAfter("zapDownload")

        commandLine("cp", "build/zap/hud-$status-$version.zap", "$testZapInstall/zap/plugin/")
    }
    
    register("zapStart") {
        group = LifecycleBasePlugin.VERIFICATION_GROUP
        description = "Starts ZAP for the unit tests"
        
        mustRunAfter("deployAddOnTestZap")
    
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

tasks.named<Test>("test") { shouldRunAfter("zapStart") }
