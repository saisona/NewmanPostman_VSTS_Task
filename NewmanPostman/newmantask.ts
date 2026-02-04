import path from "path";
import { ToolRunner } from "azure-pipelines-task-lib/toolrunner";
import {
    debug,
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
import { ArgsReporter, ArgsSSL, ArgsVariables } from "./newmanArgs.ts";

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

    ArgsSSL(newman);

    ArgsReporter(newman);

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

    ArgsVariables(newman);

    const exportCollection = getPathInput("exportCollection") || "";
    newman.argIf(filePathSupplied("exportCollection"), [
        "--export-collection",
        exportCollection,
    ]);

    const envType = getInput("environmentSourceType") || "";
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
            taskSuccess = await handleSourceFile();
        } else {
            const collectionFileUrl = getInput("collectionURL", true) || "";
            if (isURL(collectionFileUrl)) {
                const newman: ToolRunner = GetToolRunner(collectionFileUrl);
                await newman.execAsync();
            } else {
                setResult(
                    TaskResult.Failed,
                    `Provided string "${collectionFileUrl}" for collection is not a valid url`,
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

async function handleSourceFile() {
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
        const matchedFiles: string[] = matchedPaths.filter((itemPath: string) =>
            !stats(itemPath).isDirectory()
        );

        console.log("found %d files", matchedFiles.length);

        if (matchedFiles.length > 0) {
            matchedFiles.forEach((file: string) => {
                const newman: ToolRunner = GetToolRunner(file);
                const execResponse = newman.execSync();
                //TODO: handle debug
                if (true) {
                    debug(execResponse.stdout);
                }
                if (execResponse.code === 1) {
                    console.log(execResponse);
                    return false;
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
    return taskSuccess;
}

run();
