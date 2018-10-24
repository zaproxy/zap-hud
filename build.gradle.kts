plugins {
    `java-library`
}

repositories {
    mavenCentral()
}

buildDir = file("buildGradle")

java {
    sourceCompatibility = JavaVersion.VERSION_1_8
    targetCompatibility = JavaVersion.VERSION_1_8
}

sourceSets["main"].java.srcDirs(file("src"))
sourceSets["test"].java.srcDirs(file("test"))

val libs = fileTree("lib").matching { include("*.jar") }

val jupiterVersion = "5.3.1"

dependencies {
    implementation(files(libs.getFiles()))

    testImplementation("org.junit.jupiter:junit-jupiter-api:$jupiterVersion")
    testImplementation("org.junit.jupiter:junit-jupiter-params:$jupiterVersion")
    testRuntimeOnly("org.junit.jupiter:junit-jupiter-engine:$jupiterVersion")

    // Support old JUnit4 tests.
    // testImplementation("org.junit.vintage:junit-vintage-engine:$jupiterVersion")

    testImplementation("io.github.bonigarcia:selenium-jupiter:2.2.0")
}

tasks.withType<Test>().configureEach {
    useJUnitPlatform()
}
