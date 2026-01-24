import i18n from '../support/i18n';
import user from '../fixtures/user_admin_personal_account.json';

describe('Enhanced Property Features', () => {
  before(() => {
    cy.resetAppData();
    cy.visit('/signup');
    cy.signUp(user);
    cy.signIn(user);
    cy.registerLandlord(user);
  });

  beforeEach(() => {
    cy.signIn(user);
  });

  afterEach(() => {
    cy.signOut();
  });

  it('typical use case for enhanced property management', () => {
    const property = {
      name: 'Sydney Harbour Suite',
      type: 'apartment',
      rent: '1200',
      description: 'Luxury suite with harbour views',
      surface: '120',
      phone: '+61 2 9240 8500',
      digiCode: '1234',
      address: {
        street1: '45 Cooper St',
        zipCode: '2010',
        city: 'Surry Hills',
        state: 'NSW',
        country: 'Australia'
      }
    };

    // 1. Add property with basic info
    cy.navAppMenu('properties');
    cy.get('[data-cy=shortcutAddProperty]').click();
    cy.get('input[name=name]').clear().type(property.name);
    cy.get('[data-cy=submitProperty]').click();
    
    // 2. Fill in the new integration fields in the Property tab
    cy.contains(i18n.getFixedT('fr-FR')('Property information'));
    cy.get('input[name=rent]').clear().type(property.rent);
    cy.get('input[name=managerEmail]').clear().type('sarah.smith@example.com');
    cy.get('input[name=managerWhatsApp]').clear().type('+61411222333');
    cy.get('input[name=localFolderPath]').clear().type('/properties/surry-hills');
    
    // 3. Fill in financial configurations
    cy.get('input[name="financialConfigs.loanAmount"]').clear().type('1000000');
    cy.get('input[name="financialConfigs.interestRate"]').clear().type('6.2');
    cy.get('input[name="financialConfigs.incomeKeywords"]').clear().type('RENT, COOPER');
    cy.get('input[name="financialConfigs.expenseKeywords"]').clear().type('INTEREST, WESTPAC');
    
    cy.get('[data-cy=submit]').click();
    cy.contains(i18n.getFixedT('fr-FR')('Property information')).should('not.exist');

    // 4. Verify the tabs and content
    // Finance Tab
    cy.get('[data-cy=financeNav]').should('not.exist'); // Wait, I didn't add data-cy to the new tabs. I used text.
    cy.contains('Finance').click();
    cy.contains('Monthly Interest').should('be.visible');
    cy.contains('Monthly Rent').should('be.visible');
    cy.contains('Negative Gearing Impact').should('be.visible');
    cy.contains('RENT').should('be.visible');
    cy.contains('COOPER').should('be.visible');
    cy.contains('INTEREST').should('be.visible');
    cy.contains('WESTPAC').should('be.visible');
    cy.contains('Upload CSV').should('be.visible');

    // Communication Tab
    cy.contains('Communication').click();
    cy.contains('sarah.smith@example.com').should('be.visible');
    cy.contains('+61411222333').should('be.visible');
    cy.contains('Hi, the kitchen tap is leaking again').should('be.visible');

    // Documents Tab
    cy.contains('Documents').click();
    cy.contains('/properties/surry-hills').should('be.visible');
    cy.contains('Chronological Gallery & Docs').should('be.visible');
    cy.contains('2025-01-15_living_room.jpg').should('be.visible');
    cy.contains('Tenancy_Agreement_2025.pdf').should('be.visible');
  });
});
