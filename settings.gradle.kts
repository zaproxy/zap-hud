plugins {
    id("org.zaproxy.common.settings") version "0.3.0"

    id("com.diffplug.spotless") version "6.25.0" apply false
    id("com.github.node-gradle.node") version "7.0.1" apply false
}

rootProject.name = "zap-hud"
