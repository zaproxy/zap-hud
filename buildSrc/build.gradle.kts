plugins {
    `java-gradle-plugin`
    id("com.diffplug.spotless") version "6.11.0"
}

apply(from = "../gradle/compile.gradle.kts")

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.apache.commons:commons-lang3:3.8.1")
    implementation("org.zaproxy:zap-clientapi:1.6.0")
}

java {
    val javaVersion = JavaVersion.VERSION_11
    sourceCompatibility = javaVersion
    targetCompatibility = javaVersion
}

spotless {
    java {
        licenseHeaderFile("../gradle/spotless/license.java")

        googleJavaFormat("1.7").aosp()
    }

    kotlinGradle {
        ktlint()
    }
}
