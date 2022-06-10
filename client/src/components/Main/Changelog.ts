const fullVersionFile: VersionFile = {
  CurrentVersion: "1.16",
  Changelog: [
    {
      VersionChange: "1.7 -> 1.8",
      Date: "2021-04-27",
      Description: ["ADDED ability to navigate to raw melting data from binding experiment graph by left click on points."],
    },
    {
      VersionChange: "1.8 -> 1.9",
      Date: "2021-05-09",
      Description: ["ADDED 'full report' chart to draw several binding experiments in a stack."],
    },
    {
      VersionChange: "1.9-> 1.10",
      Date: "2021-05-17",
      Description: ["ADDED 'Advance fit' to 'Fit binding' tab. Users can now select individual parameters to fit or keep fixed."],
    },
    {
      VersionChange: "1.10-> 1.11",
      Date: "2021-07-01",
      Description: ["ADDED axis breaks to binding experiment chart.", "ADDED note for charts when no data item is selected"],
    },
    {
      VersionChange: "1.11-> 1.12",
      Date: "2021-07-28",
      Description: ["ADDED parameter prediction in settings."],
    },
    {
      VersionChange: "1.12-> 1.13",
      Date: "2021-11-04",
      Description: ["ADDED Each binding experiment has an unique UUID"],
    },
    {
      VersionChange: "1.13-> 1.14",
      Date: "2022-01-13",
      Description: ["ADDED 'active ligand factor parameter' to binding experiments."],
    },
    {
      VersionChange: "1.14-> 1.15",
      Date: "2022-03-02",
      Description: ["Misc. bug fixes."],
    },
    {
      VersionChange: "1.15-> 1.16",
      Date: "2022-05-29",
      Description: ["ADDED support raw data file types for devices:  'Biorad CFX', 'Applied Biosystems SDS', 'Agilent MxPro'."],
    },
  ],
};

const versionFile: VersionFile = { CurrentVersion: fullVersionFile.CurrentVersion, Changelog: fullVersionFile.Changelog.slice(-5) };

export { versionFile };

interface VersionFile {
  CurrentVersion: string;
  Changelog: Changelog[];
}

interface Changelog {
  VersionChange: string;
  Description: string[];
  Date: string;
}
