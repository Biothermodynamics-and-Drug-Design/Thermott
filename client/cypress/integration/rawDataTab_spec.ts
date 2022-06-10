import { AppData, ExperimentWell } from "@/models";
import { InitLocalStorage } from "@/utils/localStorage";
const path = require("path");

function dataUpload(fixture: string, filetype: string, model?: string) {

  cy.intercept("/api/UploadRawData").as("upload");

  cy.get("button").contains("Upload").click();

  const fileInput = cy.get(
    ".v-dialog--active  > .v-card > .v-card__text > .v-file-input > .v-input__control > .v-input__slot > .v-text-field__slot > input"
  );
  fileInput.attachFile(fixture);
  cy.get(".v-dialog--active  > .v-card > .v-card__text > .v-select").first().click();

  cy.get(".v-list-item__content").contains(filetype).click();

  if (model != null) {
    cy.get(".v-dialog--active  > .v-card > .v-card__text > .v-select").filter(':contains("model")').click();
    cy.get(".v-list-item__content").contains(model).click();
  }


  cy.get(".v-dialog--active  > .v-card > .v-card__actions > button").contains("Upload").click();

  let experimentWellsLength = 0;

  cy.wait("@upload")
    .its("response.body")
    .then((experimentWells: ExperimentWell[]) => {
      experimentWellsLength = experimentWells.length;
      expect(experimentWellsLength).to.be.greaterThan(0);
    });

  cy.get("[data-cy=experimentWells_list]").within(() => {
    cy.get(".v-list > .v-list-item").should("have.length", experimentWellsLength);
  });
}

describe("Uploading different file types and using different models", function () {
  beforeEach(() => {
    window.indexedDB.deleteDatabase("Thermott");
    cy.clearLocalStorage();
    cy.visit("/RawData");
  });

  it("Upload raw GenericCSV with all models", function () {
    dataUpload("SampleData_GenericCSV.csv", "Generic CSV", "Thermodynamic");
    window.indexedDB.deleteDatabase("Thermott");
    cy.clearLocalStorage();
    cy.visit("/RawData");
    dataUpload("SampleData_GenericCSV.csv", "Generic CSV", "Derivative");
    // dataUpload('Boltzmann*');
    // dataUpload('Derivative (Sovgal)');
  });

  const inputs = [
    { file: "SampleData_GenericCSV.csv", type: "Generic CSV", model: "Derivative" },
    { file: "SampleData_BioradCFX.txt", type: "Biorad CFX", model: "Derivative" },
    { file: "SampleData_AppliedBiosystemsSDS.txt", type: "Applied Biosystem", model: "Derivative" },
    { file: "SampleData_AgilentMxPro.txt", type: "Agilent MxPro", model: "Derivative" },
    { file: "SampleData_TmOnly.csv", type: "Melting temperature only", model: null },
  ];

  let input = inputs[0];
  it(`Upload file type '${input.type}'`, () => {
    dataUpload(input.file, input.type, input.model);
  });

  input = inputs[1];
  it(`Upload file type '${input.type}'`, () => {
    dataUpload(input.file, input.type, input.model);
  });

  input = inputs[2];
  it(`Upload file type '${input.type}'`, () => {
    dataUpload(input.file, input.type, input.model);
  });

  input = inputs[3];
  it(`Upload file type '${input.type}'`, () => {
    dataUpload(input.file, input.type, input.model);
  });

  input = inputs[4];
  it(`Upload file type '${input.type}'`, () => {
    dataUpload(input.file, input.type, input.model);
  });

});

describe("Raw data upload dialog", function () {
  beforeEach(() => {
    window.indexedDB.deleteDatabase("Thermott");
    //deleteDownloadsFolder();
    cy.clearLocalStorage();
    cy.visit("/RawData");
  });

  it("Load sample session JSON", function () {
    let appData = (window as any).Cypress.app.appData as AppData;
    cy.then(() => {
      expect(appData.bindingExperiments).to.have.lengthOf(0);
      expect(appData.experimentWells).to.have.lengthOf(0);
    });
    cy.get("button").contains("Upload").click();
    cy.get("button").contains("Sample data").click();
    cy.get(".v-list").contains("Load sample session", { matchCase: false }).click();
    cy.get(".v-dialog--active")
      .contains("Yes", { matchCase: false })
      .click()
      .wait(1000)
      .then(() => {
        expect(appData.bindingExperiments).to.have.lengthOf(3);
        expect(appData.experimentWells).to.have.lengthOf.of.at.least(10);
      });
  });

  it("Loads session JSON", function () {
    const appData = (window as any).Cypress.app.appData as AppData;

    cy.get(".v-list").should("not.exist").log("Experiment well v-list should not exist");

    cy.get("a").filter(':contains("Fit binding")').click();

    cy.get(".v-list").within(() => {
      cy.get(".v-list-item").should("have.length", 0).log("Binding experiment v-list should be empty");
    });

    cy.get("a").filter(':contains("Add raw data")').click();

    cy.get("[id=fileinput]")
      .attachFile("20210405_sample.json")
      .wait(3000)
      .then(() => {
        cy.log(JSON.stringify(appData));
        expect(appData.experimentWells.length).to.be.at.least(1, "Should have atleast 1 experiment well");
        expect(appData.bindingExperiments.length).to.be.at.least(1, "Should have atleast 1 binding experiment");
      });

    cy.get(".v-list").within(() => {
      cy.get(".v-list-item").should("have.length.at.least", 1).log("Should have atleast 1 experiment well in the v-list");
    });

    cy.get("a").filter(':contains("Fit binding parameters")').click();

    cy.get(".v-list").within(() => {
      cy.get(".v-list-item").should("have.length.at.least", 1).log("Should have atleast 1 binding experiment in the v-list");
    });
  });

  it.skip("Download current session JSON", function () {
    let appData = (window as any).Cypress.app.appData as AppData;
    const filename = "downloadsessiontest";

    // Empty session
    cy.get("button")
      .contains("Download")
      .click()
      .get(".v-dialog--active")
      .within(() => {
        cy.get("input").clear().type(filename).get("button").contains("Download").click();
      });
    cy.get("div").contains("Downloaded session data");
    //const filepath = path.join(downloadsFolder, `${filename}.json`);
    const filepath = path.join("cypress", "downloads", `${filename}.json`);
    cy.readFile(filepath, { timeout: 15000 }).then((data: AppData) => {
      expect(data).to.have.property("bindingExperiments");
      expect(data).to.have.property("experimentWells");
      expect(data).to.have.property("sessionInfo");
      expect(data.experimentWells).to.have.length(0, "Should have 0 experiment wells");
      expect(data.bindingExperiments).to.have.length(0, "Should have 0 binding experiments");
      //deleteDownloadsFolder();
    });

    // Populated session
    //const fixturesFolder = Cypress.config('fixturesFolder');

    cy.readFile(path.join("cypress", "fixtures", "20210405_sample.json"), { timeout: 15000 }).then((data: AppData) => {
      appData.bindingExperiments = data.bindingExperiments;
      appData.experimentWells = data.experimentWells;
      appData.originFiles = data.originFiles;
      appData.sessionInfo = data.sessionInfo;
      appData.errorBindingExpGroups = data.errorBindingExpGroups;
    });

    cy.get("button")
      .contains("Download")
      .click()
      .get(".v-dialog--active")
      .within(() => {
        cy.get("input").clear().type(filename).get("button").contains("Download").click();
      });
    cy.get("div").contains("Downloaded session data");
    cy.readFile(filepath, { timeout: 15000 }).then((data: AppData) => {
      expect(data).to.have.property("bindingExperiments");
      expect(data).to.have.property("experimentWells");
      expect(data).to.have.property("sessionInfo");
      expect(data.experimentWells).to.have.length.of.at.least(1, "Should have at least 1 experiment wells");
      expect(data.bindingExperiments).to.have.length.of.at.least(1, "Should at least 1 binding experiments");
    });
  });

  it("New session", function () {
    cy.get("[id=fileinput]").attachFile("20210405_sample.json");
    cy.readFile(path.join("cypress", "fixtures", "20210405_sample.json"), { timeout: 15000 }).then((data: AppData) => {
      let appData = (window as any).Cypress.app.appData as AppData;
      expect(appData.experimentWells).to.have.length(data.experimentWells.length, "Should have experiment wells");
      expect(appData.bindingExperiments).to.have.length(data.bindingExperiments.length, "Should have binding experiments");
      expect(appData.originFiles).to.have.length(data.originFiles.length, "Should have binding experiments");
      cy.get("[data-cy=experimentWells_list]").should("be.visible");

      // expect(data.experimentWells).to.have.length.of.at.least(1, "Should have at least 1 experiment wells");
      // expect(data.bindingExperiments).to.have.length.of.at.least(1, "Should at least 1 binding experiments");
    });

    cy.get(".v-system-bar > button")
      .contains("New")
      .click()
      .get("button")
      .contains("Yes", { matchCase: false })
      .click()
      .then(() => {
        cy.get("[data-cy=experimentWells_list]", { timeout: 0 }).should("not.exist");

        // let appData = (window as any).Cypress.app.appData as AppData;
        // console.log(appData.experimentWells);
        // console.log(appData.bindingExperiments);
        // expect(appData.experimentWells).to.have.length(0, "Should have 0 experiment wells");
        // expect(appData.bindingExperiments).to.have.length(0, "Should have 0 binding experiments");
      });
  });

  it("Download sample files", function () {
    cy.get("button").contains("Upload").click();

    cy.get("button").contains("Sample data").click();

    const hrefs: string[] = [];
    cy.get(".v-list > a").each(($el, index, $list) => {
      const element = $list[index];
      const href = element.getAttribute("href");
      cy.request(href).then((req) => {
        expect(req.body, "File").to.have.length.of.at.least(100);
        expect(req.status).to.equal(200);
      });
      hrefs.push(href);

      //Check if all links in sample data are unique
      if ($list.length - 1 === index) {
        expect(hrefs.length, "Unique sample file links").to.equal(new Set(hrefs).size);
      }
    });
  });
});

describe("Experiment well description card", () => {
  beforeEach(() => {
    window.indexedDB.deleteDatabase("Thermott");
    //deleteDownloadsFolder();
    cy.clearLocalStorage();
    cy.visit("/RawData");
  });

  it("Description card Gain/Model changes force a refit", () => {
    cy.get("[id=fileinput]").attachFile("20210405_sample.json");

    cy.get("[data-cy=rawDataTab]").within(() => {
      cy.get("[data-cy=experimentWells_list]").within(() => {
        cy.get(".v-list > .v-list-item").not(".v-list-item--active").first().click({ force: true });
      });
    });

    cy.get("[data-cy=tmDataDescriptionCard]").should("be.visible");

    cy.get("[data-cy=tmDataDescriptionCard]").within(() => {
      cy.get(".v-chip").filter(':contains("Model")').click();
    });

    cy.intercept({
      method: "POST",
      path: "/api/FitTm",
    }).as("fitTm");

    cy.get(".v-menu__content > .v-list > .v-list-item").filter(':contains("Thermodynamic")').click();

    cy.wait("@fitTm").then((response) => {
      expect(response.response.statusCode).to.eq(200);
    });

    cy.get("[data-cy=tmDataDescriptionCard]").within(() => {
      cy.get(".v-chip").filter(':contains("Model")').click();
    });

    cy.get(".v-menu__content > .v-list > .v-list-item").filter(':contains("Derivative")').click();

    cy.wait("@fitTm").then((response) => {
      expect(response.response.statusCode).to.eq(200);
    });

    cy.get("[data-cy=tmDataDescriptionCard]").within(() => {
      cy.get(".v-chip").filter(':contains("Gain")').click();
    });

    cy.get(".v-menu__content > .v-list > .v-list-item").filter(':contains("Blue2")').click();

    cy.wait("@fitTm").then((response) => {
      expect(response.response.statusCode).to.eq(200);
    });
  });
});

describe("TmChart menu", () => {
  beforeEach(() => {
    window.indexedDB.deleteDatabase("Thermott");
    //deleteDownloadsFolder();
    cy.clearLocalStorage();
    cy.visit("/RawData");
  });

  const clickMenu = (menuItem: string) => {
    cy.get("[data-cy=tmChartMenuButton]").click();
    cy.get(".v-list-item").filter(`:contains("${menuItem}")`).click();
  };

  it("Download plot image", () => {
    cy.get("[id=fileinput]").attachFile("20210405_sample.json");

    cy.get("[data-cy=rawDataTab]").within(() => {
      cy.get("[data-cy=experimentWells_list]").within(() => {
        cy.get(".v-list > .v-list-item").not(".v-list-item--active").first().click({ force: true });
      });
    });

    clickMenu("Save plot image");

    const filepath = path.join("cypress", "downloads", `image.png`);
    cy.readFile(filepath, "binary", { timeout: 15000 }).should((buffer) => {
      expect(buffer.length).to.be.gt(1000);
    });
  });

  it.skip("Copy graph data to clipboard", () => {
    cy.get("[id=fileinput]").attachFile("20210405_sample.json");

    cy.get("[data-cy=rawDataTab]").within(() => {
      cy.get("[data-cy=experimentWells_list]").within(() => {
        cy.get(".v-list > .v-list-item").not(".v-list-item--active").first().click({ force: true });
      });
    });

    clickMenu("Copy graph data");

    cy.window().then((win) => {
      win.navigator.clipboard.readText().then((text) => {
        expect(text).to.be.length.greaterThan(1000);
      });
    });
  });

  it("Download graph data as CSV", () => {
    cy.get("[id=fileinput]").attachFile("20210405_sample.json");

    cy.get("[data-cy=rawDataTab]").within(() => {
      cy.get("[data-cy=experimentWells_list]").within(() => {
        cy.get(".v-list > .v-list-item").not(".v-list-item--active").first().click({ force: true });
      });
    });

    clickMenu("Download graph data");

    const filepath = path.join("cypress", "downloads", "table.csv");
    cy.readFile(filepath, "binary", { timeout: 15000 }).should((buffer) => {
      expect(buffer.length).to.be.gt(1000);
    });
  });

  it("Enable Tm line in Tm chart", () => {
    cy.get("[id=fileinput]").attachFile("20210405_sample.json");

    cy.get("[data-cy=rawDataTab]").within(() => {
      cy.get("[data-cy=experimentWells_list]").within(() => {
        cy.get(".v-list > .v-list-item").not(".v-list-item--active").first().click({ force: true });
      });
    });

    clickMenu("Enable T");
  });
});

describe("Experiment list menus", () => {
  beforeEach(() => {
    window.indexedDB.deleteDatabase("Thermott");
    //deleteDownloadsFolder();
    cy.clearLocalStorage();
    cy.visit("/RawData");
  });

  it.skip("Summary dialog", () => {
    cy.get("[id=fileinput]").attachFile("20210405_sample.json");
    cy.get('button:contains("Summary")').click();

    cy.get(".v-dialog ").find("table").find("tr").its("length").should("be.gt", 4);

    cy.get("button").contains("Export", { matchCase: false }).click();
    cy.get(".v-list-item").contains("Download table", { matchCase: false }).click();

    const filepath = path.join("cypress", "downloads", `table.csv`);
    cy.readFile(filepath, "binary", { timeout: 15000 }).should((buffer) => {
      expect(buffer.length).to.be.gt(1000);
    });

    cy.get("button").contains("Export", { matchCase: false }).click();
    cy.get(".v-list-item").contains("Copy table", { matchCase: false }).click();

    cy.window().then((win) => {
      win.navigator.clipboard.readText().then((text) => {
        assert(text.includes("id") && text.includes("name") && text.includes("Tm"), "Includes table headers");
        expect(text.length).to.be.gt(1000);
      });
    });
  });

  it("Heatmap dialog open", () => {
    cy.get("[id=fileinput]").attachFile("20210405_sample.json");
    cy.get('button:contains("Heatmap")').click();
    cy.get(".v-dialog:contains('Summary heatmap')");
  });

  it("Report chart dialog open", () => {
    cy.get("[id=fileinput]").attachFile("20210405_sample.json");
    cy.get('button:contains("Report Chart")').click();
    cy.get(".v-dialog:contains('Report chart')");
  });
});
