import {
  filePathSupplied,
  getBoolInput,
  getDelimitedInput,
  getInput,
  getPathInput,
} from "azure-pipelines-task-lib";
import { ToolRunner } from "azure-pipelines-task-lib/toolrunner";

export function ArgsVariables(newman: ToolRunner) {
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
}

export function ArgsSSL(newman: ToolRunner) {
  const sslClientCert = getPathInput("sslClientCert", false, true);
  //NOTE: as getPathInput will throw it is safe
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
}

export function ArgsReporter(newman: ToolRunner) {
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
}
