const path = require('path');


export const deleteDownloadsFolder = () => {
    const downloadsFolder = Cypress.config('downloadsFolder')
  
    cy.task('deleteFolder', downloadsFolder)
  }