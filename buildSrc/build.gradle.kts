plugins {
    `kotlin-dsl`
    `java-gradle-plugin`
    id("com.diffplug.gradle.spotless") version "3.15.0"
}

apply(from = "../gradle/compile.gradle.kts")

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

dependencies {
    implementation("org.apache.commons:commons-lang3:3.8.1")
    implementation("org.zaproxy:zap-clientapi:1.6.0")
}

java {
    sourceCompatibility = JavaVersion.VERSION_1_8
    targetCompatibility = JavaVersion.VERSION_1_8
}

spotless {
    java {
        licenseHeaderFile("../gradle/spotless/license.java")

        googleJavaFormat().aosp()
    }
}