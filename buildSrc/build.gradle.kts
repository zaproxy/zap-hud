plugins {
    `kotlin-dsl`
    `java-gradle-plugin`
    id("com.diffplug.gradle.spotless") version "3.15.0"
}

gradlePlugin {
    plugins {
        register("zap-add-on-plugin") {
            id = "zap-add-on"
            implementationClass = "org.zaproxy.gradle.AddOnPlugin"
        }
    }
}

repositories {
    mavenLocal()
    mavenCentral()
}

spotless {
    java {
        licenseHeaderFile("../gradle/spotless/license.java")

        googleJavaFormat().aosp()
    }
}