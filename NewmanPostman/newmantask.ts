import path = require("path");

import { ToolRunner } from "azure-pipelines-task-lib/toolrunner";
import {
    error,
    filePathSupplied,
    find,
    getBoolInput,
    getDelimitedInput,
    getInput,
    getPathInput,
    match,
    setResourcePath,
    setResult,
    stats,
    TaskResult,
    tool,
    which,
} from "azure-pipelines-task-lib";
import isURL from "is-url";

function GetToolRunner(collectionToRun: string) {
    let pathToNewman = getInput("pathToNewman", false);
    if (typeof pathToNewman != "undefined" && pathToNewman) {
        console.info("Specific path to newman found");
    } else {
        console.info("No specific path to newman, using default of 'newman'");
        pathToNewman = "newman";
    }

    const newman: ToolRunner = tool(which(pathToNewman, true));

    newman.arg("run");
    newman.arg(collectionToRun);

    const sslClientCert = getPathInput("sslClientCert", false, true);
    //NOTE: as getPathInput will throw it is safe
    newman.argIf;
    newman.argIf(
        typeof sslClientCert != "undefined" &&
            filePathSupplied("sslClientCert"),
        ["--ssl-client-cert", sslClientCert || ""],
    );
    const sslClientKey = getPathInput("sslClientKey", false, true) || "";
    newman.argIf(
        typeof sslClientKey != "undefined" && filePathSupplied("sslClientKey"),
        ["--ssl-client-key", sslClientKey],
    );
    const sslInsecure = getBoolInput("sslInsecure");
    newman.argIf(sslInsecure, ["--insecure"]);

    const unicodeDisabled = getBoolInput("unicodeDisabled");
    newman.argIf(unicodeDisabled, ["--disable-unicode"]);

    const forceNoColor = getBoolInput("forceNoColor");
    newman.argIf(forceNoColor, ["--no-color"]);

    const reporterHtmlTemplate = getPathInput(
        "reporterHtmlTemplate",
        false,
        true,
    );
    newman.argIf(
        typeof reporterHtmlTemplate != "undefined" &&
            filePathSupplied("reporterHtmlTemplate"),
        ["--reporter-html-template", reporterHtmlTemplate || ""],
    );
    const reporterHtmlExport = getPathInput("reporterHtmlExport");
    newman.argIf(
        typeof reporterHtmlExport != "undefined" &&
            filePathSupplied("reporterHtmlExport"),
        ["--reporter-html-export", reporterHtmlExport || ""],
    );
    /**
     * Items for HTML extra https://www.npmjs.com/package/newman-reporter-htmlextra.
     */
    const reporterHtmlExtraTemplate = getPathInput(
        "reporterHtmlExtraTemplate",
        false,
        true,
    );
    newman.argIf(
        typeof reporterHtmlExtraTemplate != "undefined" &&
            filePathSupplied("reporterHtmlExtraTemplate"),
        ["--reporter-htmlextra-template ", reporterHtmlTemplate || ""],
    );
    const reporterHtmlExtraExport = getPathInput("reporterHtmlExtraExport");
    newman.argIf(
        typeof reporterHtmlExtraExport != "undefined" &&
            filePathSupplied("reporterHtmlExtraExport"),
        ["--reporter-htmlextra-export", reporterHtmlExtraExport || ""],
    );
    newman.argIf(getBoolInput("htmlExtraDarkTheme"), [
        "--reporter-htmlextra-darkTheme",
    ]);
    newman.argIf(getBoolInput("htmlExtraLogs"), ["--reporter-htmlextra-logs"]);
    newman.argIf(getBoolInput("htmlExtraTestPaging"), [
        "--reporter-htmlextra-testPaging",
    ]);

    const htmlExtraReportTitle = getInput("htmlExtraReportTitle");
    newman.argIf(
        typeof htmlExtraReportTitle != "undefined" && htmlExtraReportTitle,
        ["--reporter-htmlextra-title", htmlExtraReportTitle || ""],
    );

    const reporterJsonExport = getPathInput("reporterJsonExport");
    newman.argIf(
        typeof reporterJsonExport != "undefined" &&
            filePathSupplied("reporterJsonExport"),
        ["--reporter-json-export", reporterJsonExport || ""],
    );
    const reporterJUnitExport = getPathInput(
        "reporterJUnitExport",
        false,
        false,
    );
    newman.argIf(
        typeof reporterJUnitExport != "undefined" &&
            filePathSupplied("reporterJUnitExport"),
        ["--reporter-junit-export", reporterJUnitExport || ""],
    );

    const verbose = getBoolInput("verbose");
    newman.argIf(verbose, ["--verbose"]);

    const reporterList = getInput("reporters") || "";
    const customReporter = getInput("customReporter") || "";
    let newReporterList = "";

    if (customReporter.length > 0) {
        console.info("Custom report configuration detected");
        if (
            reporterList != "undefined" && reporterList.split(",").length != 0
        ) { //there is at least one reporter from select
            //append custom one to the list
            newReporterList = reporterList + "," + customReporter.trim();
        } else { //only custom report
            newReporterList = customReporter.trim();
        }
    } else {
        console.info("No custom report configured");
        newReporterList = reporterList;
    }
    console.info("Reporter list is : " + newReporterList);

    newman.argIf(
        newReporterList != null && (newReporterList.split(",").length != 0),
        ["-r", newReporterList],
    );

    const delayRequest = getInput("delayRequest");
    newman.argIf(typeof delayRequest != "undefined" && delayRequest, [
        "--delay-request",
        delayRequest || "",
    ]);
    const timeoutRequest = getInput("timeoutRequest");
    newman.argIf(typeof timeoutRequest != "undefined" && timeoutRequest, [
        "--timeout-request",
        timeoutRequest || "",
    ]);
    const timeoutGlobal = getInput("timeoutGlobal", false);
    newman.argIf(typeof timeoutGlobal != "undefined" && timeoutGlobal, [
        "--timeout",
        timeoutGlobal || "",
    ]);
    const timeoutScript = getInput("timeoutScript", false);
    newman.argIf(typeof timeoutScript != "undefined" && timeoutScript, [
        "--timeout-script",
        timeoutScript || "",
    ]);

    const numberOfIterations = getInput("numberOfIterations");
    newman.argIf(
        typeof numberOfIterations != "undefined" && numberOfIterations,
        ["-n", numberOfIterations || ""],
    );
    const globalVariable = getPathInput("globalVariables", false, true);
    newman.argIf(
        typeof globalVariable != "undefined" &&
            filePathSupplied("globalVariables"),
        ["--globals", globalVariable || ""],
    );
    const dataFile = getPathInput("dataFile", false, true);
    newman.argIf(
        typeof globalVariable != "undefined" && filePathSupplied("dataFile"),
        ["--iteration-data", dataFile || ""],
    );

    const folder = getInput("folder") || "";
    if (folder.length > 0) {
        const splitted = folder.split(",");
        splitted.forEach((folder) => {
            newman.arg(["--folder", folder.trim()]);
        });
    }

    const globalVars: string[] = getDelimitedInput("globalVars", "\n");
    globalVars.forEach((globVar) => {
        newman.arg(["--global-var", globVar.trim()]);
    });
    const envVars: string[] = getDelimitedInput("envVars", "\n");
    envVars.forEach((envVar) => {
        newman.arg(["--env-var", envVar.trim()]);
    });
    newman.argIf(getBoolInput("ignoreRedirect"), ["--ignore-redirects"]);

    const exportEnvironment = getPathInput("exportEnvironment") || "";
    newman.argIf(filePathSupplied("exportEnvironment"), [
        "--export-environment",
        exportEnvironment,
    ]);
    const exportGlobals = getPathInput("exportGlobals") || "";
    newman.argIf(filePathSupplied("exportGlobals"), [
        "--export-globals",
        exportGlobals,
    ]);
    const exportCollection = getPathInput("exportCollection") || "";
    newman.argIf(filePathSupplied("exportCollection"), [
        "--export-collection",
        exportCollection,
    ]);

    const envType = getInput("environmentSourceType");
    if (envType == "file") {
        console.info("File used for environment");
        const filePathInput = getPathInput("environment", true, true);
        newman.arg(["-e", filePathInput || ""]);
    } else if (envType == "url") {
        const envURl = getInput("environmentUrl", true) || "";
        if (isURL(envURl)) {
            console.info("URL used for environment");
            newman.arg(["-e", envURl]);
        } else {
            setResult(
                TaskResult.Failed,
                'Provided string "' + envURl +
                    '" for environment is not a valid url',
            );
        }
    } else {
        //no environement used. Don't add argument, just log info.
        console.info("No environment set, no need to add it in argument");
    }
    return newman;
}

async function run() {
    try {
        // tl.debug('executing newman')
        setResourcePath(path.join(__dirname, "task.json"));
        let taskSuccess = true;
        if (getInput("collectionSourceType", true) == "file") {
            console.log("Collection Source Type is set to file");
            let collectionFileSource = getPathInput(
                "collectionFileSource",
                true,
                true,
            ) || "";
            if (stats(collectionFileSource).isDirectory()) {
                const contents: string[] = getDelimitedInput(
                    "Contents",
                    "\n",
                    true,
                );
                collectionFileSource = path.normalize(collectionFileSource);

                const allPaths: string[] = find(collectionFileSource);
                const matchedPaths: string[] = match(
                    allPaths,
                    contents,
                    collectionFileSource,
                );
                const matchedFiles: string[] = matchedPaths.filter((
                    itemPath: string,
                ) => !stats(itemPath).isDirectory());

                console.log("found %d files", matchedFiles.length);

                if (matchedFiles.length > 0) {
                    matchedFiles.forEach((file: string) => {
                        const newman: ToolRunner = GetToolRunner(file);
                        const execResponse = newman.execSync();
                        // tl.debug(execResponse.stdout);
                        if (execResponse.code === 1) {
                            console.log(execResponse);
                            taskSuccess = false;
                        }
                    });
                } else {
                    error(
                        "Could not find any collection files in the path provided",
                    );
                    taskSuccess = false;
                }
            } else {
                const newman: ToolRunner = GetToolRunner(
                    collectionFileSource || "",
                );
                await newman.execAsync();
            }
        } else {
            const collectionFileUrl = getInput("collectionURL", true) || "";
            if (isURL(collectionFileUrl)) {
                const newman: ToolRunner = GetToolRunner(collectionFileUrl);
                await newman.execAsync();
            } else {
                setResult(
                    TaskResult.Failed,
                    'Provided string "' + collectionFileUrl +
                        '" for collection is not a valid url',
                );
            }
        }
        if (taskSuccess) {
            setResult(TaskResult.Succeeded, "Success");
        } else {
            setResult(TaskResult.Failed, "Failed");
        }
    } catch (err: unknown) {
        const error = err as Error;
        setResult(TaskResult.Failed, error.message);
    }
}

run();
