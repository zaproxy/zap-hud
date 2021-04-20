plugins {
    `java-gradle-plugin`
    id("com.diffplug.spotless") version "5.12.1"
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
    sourceCompatibility = JavaVersion.VERSION_1_8
    targetCompatibility = JavaVersion.VERSION_1_8
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
