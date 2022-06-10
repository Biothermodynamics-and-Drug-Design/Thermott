import { AppData, ExperimentWell } from "@/models";

describe("Tutorial", () => {
  it("tutorial", () => {
    //window.indexedDB.deleteDatabase("Thermott");
    //cy.clearLocalStorage();
    cy.visit("");
    cy.intercept("/api/UploadRawData").as("upload");

    cy.get("button:contains('Quick Start tutorial')").click();

    cy.get(".v-dialog").within(() => {
      cy.contains("Yes", { matchCase: false }).click();
    });

    cy.url().should("include", "/RawData");

    let href = "";

    cy.get("[data-cy=demo-card]").within(() => {
      cy.contains("Sample data", { matchCase: false })
        .eq(0)
        .invoke("attr", "href")
        .then(($href) => {
          href = $href;
          cy.request($href).then((req) => {
            expect(req.body, "File").to.have.length.of.at.least(100);
            expect(req.statusText).to.equal("OK");
          });
        });
    });

    cy.get("button").contains("Upload", { matchCase: false }).click();
    const fileInput = cy.get(
      ".v-dialog--active  > .v-card > .v-card__text > .v-file-input > .v-input__control > .v-input__slot > .v-text-field__slot > input"
    );
    fileInput.attachFile("SampleData_GenericCSV_CAXIII_3ligands.csv");

    cy.get(".v-dialog--active  >>> .v-select").contains("model", { matchCase: false }).click();
    cy.get(".v-list-item__content").contains("Thermodynamic", { matchCase: false }).click();

    cy.get(".v-dialog--active  >>> .v-select").contains("file type", { matchCase: false }).click({ force: true });
    cy.get(".v-list-item__content").contains("Generic CSV", { matchCase: false }).click();

    cy.get(".v-dialog--active  >>> button").contains("Upload").click();

    cy.wait("@upload")
      .its("response.body")
      .then((experimentWells: ExperimentWell[]) => {
        expect(experimentWells.length).to.be.greaterThan(0);
      });

    cy.get("[data-cy=demo-card]").contains("Metadata");

    cy.get(".v-tab").contains("Add experiment info", { matchCase: false }).click();

    cy.url().should("include", "/MetaData/ExperimentWellsEditor");

    cy.get("[data-cy=demo-card]").within(() => {
      let appData = (window as any).Cypress.app.appData as AppData;

      const proteins = Array.from(new Set(appData.experimentWells.map((x) => x.protein)));
      expect(proteins.length, "All experiments wells' protein names are null").to.equal(1);
      expect(proteins[0], "All experiments wells' protein names are null").to.equal(null);

      const protein_concs = Array.from(new Set(appData.experimentWells.map((x) => x.protein_conc)));
      expect(protein_concs.length, "All experiments wells' protein concs are null").to.equal(1);
      expect(protein_concs[0], "All experiments wells' protein concs are null").to.equal(null);

      const ligands = Array.from(new Set(appData.experimentWells.map((x) => x.ligand)));
      expect(ligands.length, "All experiments wells' ligand names are null").to.equal(1);
      expect(ligands[0], "All experiments wells' ligand names are null").to.equal(null);

      let ligand_concs = Array.from(new Set(appData.experimentWells.map((x) => x.ligand_conc)));
      expect(ligand_concs.length, "All experiments wells' ligand concs are null").to.equal(1);
      expect(ligand_concs[0], "All experiments wells' ligand concs are null").to.equal(null);

      cy.get("button").contains("Here", { matchCase: false }).click();

      ligand_concs = Array.from(new Set(appData.experimentWells.map((x) => x.ligand_conc)));
      expect(ligand_concs.length, "All experiments wells' ligand concs are 0 or more").to.equal(
        ligand_concs.filter((x) => !Number.isNaN(x) && x >= 0).length
      );

      cy.get("button").contains("Continue", { matchCase: false }).click({ force: true });
    });

    cy.get("[data-cy=demo-card]").contains("Go to Experiment builder tab");

    cy.get(".v-tab").contains("Experiment builder", { matchCase: false }).click();

    cy.get("[data-cy=BuilderExperimentWellsList] >>> .v-list-item ").each((el, index, list) => {
      if (index < 11) {
        cy.wrap(el).within(() => {
          cy.get(".v-input--checkbox").click({ ctrlKey: true });
        });
      }
    });

    cy.get("button").contains("Create binding experiment", { matchCase: false }).click();

    cy.get(".v-dialog > [data-cy=demo-card]").contains("Here", { matchCase: false }).click();

    const checkValue = (label: string, value: string | number) =>
      cy
        .get(".v-text-field")
        .contains(label, { matchCase: false })
        .parent()
        .within(() => {
          cy.get("input").should("have.value", value);
        });

    cy.get(".v-dialog").within(() => {
      checkValue("Protein name", "CAXIII");
      checkValue("Ligand name", "VD11-31-2");
      checkValue("Protein conc.", 10);

      checkValue("Enthalpy of unfolding", 460000);
      checkValue("Enthalpy of binding", -42000);
      checkValue("Heat capacity of binding", -800);
      checkValue("Heat capacity of unfolding", 17000);

      let appData = (window as any).Cypress.app.appData as AppData;
      expect(appData.bindingExperiments.length, "No binding experiments exist").to.equal(0);

      cy.get("button")
        .contains("Add", { matchCase: false })
        .click()
        .then(() => {
          let appData = (window as any).Cypress.app.appData as AppData;

          expect(appData.bindingExperiments.length, "One binding experiment is created").to.equal(1);
          expect(appData.bindingExperiments[0].expPointIndexes.length, "Binding experiments has experiments wells").to.equal(11);
        });
    });

    cy.get("button").contains("Continue", { matchCase: false }).click({ force: true });
    cy.get("button").contains("Continue", { matchCase: false }).click({ force: true });

    cy.get(".v-tab").contains("Fit binding", { matchCase: false }).click();
    cy.url().should("include", "/Binding");

    cy.contains(".v-card", "Binding experiments", { matchCase: false }).within(() => {
      cy.get(".v-list-item").first().click();
    });
    cy.intercept("POST", "/api/BindingFit_KbOnly").as("fitBinding");

    cy.contains("button", "Fit", { matchCase: false }).click();

    cy.wait("@fitBinding")
      .then((result) => {
        expect(result.response.statusMessage).to.equal("OK");
      })
      .wait(1000)
      .then(() => {
        let appData = (window as any).Cypress.app.appData as AppData;
        expect(appData.bindingExperiments[0].params.Kb, "Binding experiments has a reasonable Kb value").to.be.greaterThan(10 ** 5);
      });

    cy.get("button").contains("Continue", { matchCase: false }).click({ force: true });

    cy.get("button").contains("End", { matchCase: false }).click({ force: true });

    cy.get(".v-dialog").within(() => {
      cy.contains("Yes", { matchCase: false }).click();
    });
  });
});
