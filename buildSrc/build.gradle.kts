plugins {
    `java-gradle-plugin`
    id("com.diffplug.spotless") version "6.20.0"
}

apply(from = "../gradle/compile.gradle.kts")

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.apache.commons:commons-lang3:3.12.0")
    implementation("org.zaproxy:zap-clientapi:1.12.0")
}

java {
    val javaVersion = JavaVersion.VERSION_11
    sourceCompatibility = javaVersion
    targetCompatibility = javaVersion
}

spotless {
    java {
        licenseHeaderFile("../gradle/spotless/license.java")

        googleJavaFormat("1.17.0").aosp()
    }

    kotlinGradle {
        ktlint()
    }
}
