// Build tweaks when running in GitHub CI

import org.gradle.api.tasks.testing.logging.TestLogEvent

fun isEnvVarTrue(envvar: String) = System.getenv(envvar) == "true"

if (isEnvVarTrue("CI") && System.getenv("GITHUB_WORKFLOW") == "Java CI") {

    tasks.withType(Test::class).configureEach {
        testLogging {
            exceptionFormat = org.gradle.api.tasks.testing.logging.TestExceptionFormat.FULL
            events = setOf(TestLogEvent.FAILED, TestLogEvent.PASSED)
        }
    }

}