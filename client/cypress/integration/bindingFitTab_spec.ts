const path = require("path");

describe("Binding description card", () => {
  beforeEach(() => {
    window.indexedDB.deleteDatabase("Thermott");
    //deleteDownloadsFolder();
    cy.clearLocalStorage();
    cy.visit("/Binding");
    cy.intercept("POST", "/api/BindingFit_KbOnly").as("BindingFit_KbOnly");
  });

  it("Is only visible when selected one binding experiment", () => {
    cy.get("[id=fileinput]").attachFile("20210405_sample.json");
    cy.get("[data-cy=bindingDescriptionCard]").should("not.be.visible");

    cy.get("[data-cy=bindingExperimentList]").then(() => {
      cy.get(".v-list-item").first().click();
      cy.get("[data-cy=bindingDescriptionCard]").should("be.visible");
      cy.get(".v-list-item").first().click();
      cy.get("[data-cy=bindingDescriptionCard]").should("not.be.visible");
    });

    cy.get("[data-cy=bindingExperimentList] >>> .v-list-item").then((elements) => {
      cy.wrap(elements[0]).click({ ctrlKey: true }).wrap(elements[1]).click({ ctrlKey: true });
      cy.get("[data-cy=bindingDescriptionCard]").contains("Fit selected", { matchCase: false });
    });
  });

  //it("Is only visible when selected one binding experiment", () => {})
  it("Fitting one binding experiment", () => {
    cy.get("[id=fileinput]").attachFile("20210405_sample.json");
    cy.get("[data-cy=bindingExperimentList] >>> .v-list-item").first().click();
    cy.get("[data-cy=bindingDescriptionCard]").contains("Fit", { matchCase: false }).click();

    cy.wait("@BindingFit_KbOnly").then((res) => {
      expect(res.response.statusCode).to.be.eq(200, "Fit successful");
      expect((res.response.body as { Kb: number }).Kb).to.be.gt(10000, "Reasonable positive Kb value in response");
    });
  });

  it("Fitting multiple binding experiments", () => {
    cy.get("[id=fileinput]").attachFile("20210405_sample.json");

    cy.get("[data-cy=bindingExperimentList] >>> .v-list-item").then((elements) => {
      cy.wrap(elements[0]).click({ ctrlKey: true }).wrap(elements[1]).click({ ctrlKey: true }).wrap(elements[2]).click({ ctrlKey: true });

      cy.get("[data-cy=bindingDescriptionCard]").contains("Fit selected", { matchCase: false }).click();
    });

    cy.wait("@BindingFit_KbOnly").then((res) => {
      expect(res.response.statusCode).to.be.eq(200, "Fit successful");
      expect((res.response.body as { Kb: number }).Kb).to.be.gt(10000, "Reasonable positive Kb value in response");
    });
    cy.wait("@BindingFit_KbOnly").then((res) => {
      expect(res.response.statusCode).to.be.eq(200, "Fit successful");
      expect((res.response.body as { Kb: number }).Kb).to.be.gt(10000, "Reasonable positive Kb value in response");
    });
    cy.wait("@BindingFit_KbOnly").then((res) => {
      expect(res.response.statusCode).to.be.eq(200, "Fit successful");
      expect((res.response.body as { Kb: number }).Kb).to.be.gt(10000, "Reasonable positive Kb value in response");
    });
  });

  it("Manually editing Kb", () => {
    cy.get("[id=fileinput]").attachFile("20210405_sample.json");

    cy.get("[data-cy=bindingExperimentList] >>> .v-list-item").first().click();

    cy.get("[data-cy=bindingDescriptionCard]").within(() => {
      cy.get(".mdi-pencil").click();
      cy.get(".v-input")
        .first()
        .within(() => {
          cy.get("input").clear();
          cy.get("input").type("1000");
          cy.get("input").blur();
        });
    });
  });

  it("Adding comment", () => {
    cy.get("[id=fileinput]").attachFile("20210405_sample.json");
    cy.get("[data-cy=bindingExperimentList] >>> .v-list-item").first().click();
    cy.get("[data-cy=bindingDescriptionCard]").within(() => {
      cy.get(".v-input")
        .contains("Comment")
        .parent()
        .within(() => {
          cy.get("input").type("Here's my comment");
        });
    });
  });
});

describe("Binding chart menu", () => {
  beforeEach(() => {
    window.indexedDB.deleteDatabase("Thermott");
    //deleteDownloadsFolder();
    cy.clearLocalStorage();
    cy.visit("/Binding");
    cy.intercept("POST", "/api/BindingFit_KbOnly").as("BindingFit_KbOnly");
  });

  const clickMenu = (menuItem: string) => {
    cy.get("[data-cy=bindingChartMenuButton]").click();
    cy.get(".v-list-item").contains(menuItem, { matchCase: false }).click();
  };

  it.skip("Copy curve data", () => {
    cy.get("[id=fileinput]").attachFile("20210405_sample.json");

    cy.get("[data-cy=bindingExperimentList] >>> .v-list-item").first().click();

    clickMenu("Copy curve data");
    cy.window().then((win) => {
      win.navigator.clipboard.readText().then((text) => {
        expect(text).to.be.length.greaterThan(1000);
        expect(text).to.contain("model Tm");
        expect(text).to.contain("model C");
        expect(text).to.contain("exp. Tm");
        expect(text).to.contain("exp. C");
      });
    });
  });

  it("Download curve data", () => {
    cy.get("[id=fileinput]").attachFile("20210405_sample.json");

    cy.get("[data-cy=bindingExperimentList] >>> .v-list-item").first().click();
    clickMenu("Save curve data");

    const filepath = path.join("cypress", "downloads", `table.csv`);
    cy.readFile(filepath, "binary", { timeout: 15000 }).should((buffer) => {
      expect(buffer.length).to.be.gt(1000);
    });
  });

  it("Conf. interval toggle", () => {
    cy.get("[id=fileinput]").attachFile("20210405_sample.json");
    cy.get("[data-cy=bindingExperimentList] >>> .v-list-item").first().click();
    clickMenu("Hide conf.");
    clickMenu("Show conf.");
  });
});

describe("Summary/Error dialog", () => {
  beforeEach(() => {
    window.indexedDB.deleteDatabase("Thermott");
    //deleteDownloadsFolder();
    cy.clearLocalStorage();
    cy.visit("/Binding");
    cy.intercept("POST", "/api/BindingFit_KbOnly").as("BindingFit_KbOnly");
  });

  it("Opening/Closing dialog", () => {
    cy.get("[id=fileinput]").attachFile("20210405_sample.json");
    cy.get("button").contains("Summary", { matchCase: false }).click();

    cy.get(".v-dialog")
      .contains("Summary/Error", { matchCase: false })
      .within(() => {
        cy.get(".mdi-close").click();
      });
  });

  it.skip("Binding experiments tab - Copy to clipboard table", () => {
    cy.get("[id=fileinput]").attachFile("20210405_sample.json");
    cy.get("button").contains("Summary", { matchCase: false }).click();

    cy.get(".v-tab--active").contains("Binding experiments", { matchCase: false });

    cy.get("button").contains("Get table data", { matchCase: false }).click();

    cy.get(".v-menu__content > .v-list > .v-list-item").contains("Copy to clipboard", { matchCase: false }).click();

    cy.window().then((win) => {
      win.navigator.clipboard.readText().then((text) => {
        expect(text).to.be.length.greaterThan(500);
        expect(text).to.contain("id");
        expect(text).to.contain("protein");
        expect(text).to.contain("ligand");
      });
    });
  });

  it("Binding experiments tab - Download table", () => {
    cy.get("[id=fileinput]").attachFile("20210405_sample.json");
    cy.get("button").contains("Summary", { matchCase: false }).click();

    cy.get(".v-tab--active").contains("Binding experiments", { matchCase: false });

    cy.get("button").contains("Get table data", { matchCase: false }).click();
    cy.get(".v-menu__content > .v-list > .v-list-item").contains("Download table", { matchCase: false }).click({ force: true });

    const filepath = path.join("cypress", "downloads", `table.csv`);
    cy.readFile(filepath, "binary", { timeout: 15000 }).should((buffer) => {
      console.log(buffer);
      expect(buffer.length).to.be.gt(900);
    });
  });
});
