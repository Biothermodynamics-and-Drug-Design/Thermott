import { AppData } from "@/models";

describe("Compatability of session files from older version", () => {
  beforeEach(() => {
    window.indexedDB.deleteDatabase("Thermott");
    cy.clearLocalStorage();
    cy.visit("/RawData");
  });
  it("Session file missing 'sessionInfo', 'errorBindingExpGroups'. No client versions included.", () => {
    cy.get("[id=fileinput]").attachFile("20210222_VP.json");

    cy.get("[data-cy=experimentWells_list]").then(() => {
      let appData = (window as any).Cypress.app.appData as AppData;
      expect(appData.experimentWells).to.be.length(72);
      expect(appData.bindingExperiments).to.be.length(9);
      expect(appData.sessionInfo).to.be.exist;
      expect(appData.errorBindingExpGroups).to.be.exist;
    });
  });
});
