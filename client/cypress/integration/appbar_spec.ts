import { AppData } from "@/models";

describe("AppBar functionality", function () {
  beforeEach(() => {
    window.indexedDB.deleteDatabase("Thermott");
    cy.visit("/RawData");
  });

  it("Opens SessionInfo dialog and allows to input data", function () {
    const appData = (window as any).Cypress.app.appData as AppData;

    cy.get(".v-system-bar > .v-btn").contains("Session", { matchCase: false }).click();
    cy.get(".v-dialog--active > .v-card > .v-card__title").contains("Analysis file info", { matchCase: false });

    expect(appData.sessionInfo.name).equals("");
    expect(appData.sessionInfo.author).equals("");

    const sessionName = "Test session";
    cy.get(".v-dialog--active")
      .contains("Session name", { matchCase: false })
      .parent()
      .within(() => {
        cy.get("input").type(sessionName);
      });
    const author = "Dr John Mittens";
    cy.get(".v-dialog--active")
      .contains("Experiment author", { matchCase: false })
      .parent()
      .within(() => {
        cy.get("input").type(author);
      });
    const experimentDate = "2027-01-01";
    cy.get(".v-dialog--active")
      .contains("Experiment date", { matchCase: false })
      .parent()
      .within(() => {
        cy.get("input").type(experimentDate);
      });
    // cy.get('.v-picker').contains('Ok', { matchCase: false }).click();

    cy.get(".v-dialog--active")
      .contains("Apply", { matchCase: false })
      .click()
      .then(() => {
        expect(appData.sessionInfo.name).equals(sessionName);
        expect(appData.sessionInfo.author).equals(author);
        expect(appData.sessionInfo.experimentDate).equals(experimentDate);
        expect(appData.sessionInfo.sessionDate).equals(new Date().toISOString().slice(0, 10));
      });

    cy.get("div").contains("Information updated", { matchCase: false });
  });

  it("Open documentation website", function () {
    cy.get(".v-system-bar > a")
      .contains("Documentation", { matchCase: false })
      .parent()
      .should("have.attr", "href")
      .then((href: any) => {
        cy.request(href).its("status").should("equal", 200);
      });
  });

  it("Open/Close settings dialog", function () {
    cy.get(".v-system-bar > button")
      .contains("Settings", { matchCase: false })
      .click()
      .get(".v-dialog")
      .contains("Settings", { matchCase: false });
    cy.get(".v-dialog--active > .v-card > .v-card__title > button").click();
    cy.get(".v-dialog--active").should("not.exist");
  });
});
