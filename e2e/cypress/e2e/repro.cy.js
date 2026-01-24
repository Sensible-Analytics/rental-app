describe('Repro Registration', () => {
  it('should register successfully', () => {
    const user = {
      firstName: 'Jean',
      lastName: 'Doe',
      email: `test${Date.now()}@test.com`,
      password: 'test1234',
      locale: 'fr-FR',
      currency: 'EUR',
      orgName: 'Repro Org'
    };

    cy.visit('/signup');
    cy.get('input[name=firstName]').clear().type(user.firstName);
    cy.get('input[name=lastName]').clear().type(user.lastName);
    cy.get('input[name=email]').clear().type(user.email);
    cy.get('input[name=password]').clear().type(user.password);
    cy.get('[data-cy=submit]').click();

    cy.url().should('include', '/signin');
    cy.get('input[name=email]').clear().type(user.email);
    cy.get('input[name=password]').clear().type(user.password);
    cy.get('[data-cy=submit]').click();

    cy.url().should('include', '/firstaccess');

    cy.get('[data-cy=companyFalse]').click();
    cy.get('input[name=name]').clear().type(user.orgName);
    
    // Manual select for locale to see if muiSelect is the issue
    cy.get('input[name="locale"]').parent().click();
    cy.get(`.MuiList-root [data-value="${user.locale}"]`).click();

    // Manual select for currency
    cy.get('input[name="currency"]').parent().click();
    cy.get(`.MuiList-root [data-value="${user.currency}"]`).click();

    cy.get('[data-cy=submit]').click();

    cy.url().should('include', '/dashboard');
  });
});
