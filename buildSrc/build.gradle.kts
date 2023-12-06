plugins {
    `kotlin-dsl`
    id("com.diffplug.spotless")
    id("org.zaproxy.common")
}

dependencies {
    implementation("org.apache.commons:commons-lang3:3.12.0")
    implementation("org.zaproxy:zap-clientapi:1.13.0")
}

java {
    val javaVersion = JavaVersion.VERSION_11
    sourceCompatibility = javaVersion
    targetCompatibility = javaVersion
}

spotless {
    kotlinGradle {
        ktlint()
    }
}
