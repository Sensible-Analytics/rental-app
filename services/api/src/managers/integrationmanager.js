import { Collections } from '@microrealestate/common';
import moment from 'moment';

export async function getFinance(req, res) {
  const realm = req.realm;
  const propertyId = req.params.id;

  const property = await Collections.Property.findOne({
    _id: propertyId,
    realmId: realm._id
  }).lean();

  if (!property) {
    return res.sendStatus(404);
  }

  // Logic for Negative Gearing Impact
  const loanAmount = property.financialConfigs?.loanAmount || 0;
  const interestRate = (property.financialConfigs?.interestRate || 0) / 100;
  const monthlyInterest = (loanAmount * interestRate) / 12;
  const netRent = (property.price || 0) * (52 / 12);
  const negativeGearingImpact = Math.max(0, monthlyInterest - netRent);

  // Mock Reconciliation Data
  const reconciledTransactions = [
    { date: moment().date(5).toISOString(), description: 'WESTPAC LOAN INT', amount: -monthlyInterest, category: 'Interest' },
    { date: moment().date(12).toISOString(), description: 'RENT PAYMENT', amount: netRent, category: 'Income' }
  ];

  res.json({
    monthlyInterest,
    netRent,
    negativeGearingImpact,
    reconciledTransactions
  });
}

export async function getCommunication(req, res) {
  const realm = req.realm;
  const propertyId = req.params.id;

  const property = await Collections.Property.findOne({
    _id: propertyId,
    realmId: realm._id
  }).lean();

  if (!property) {
    return res.sendStatus(404);
  }

  // Mock Unified Feed
  const messages = [
    {
      source: 'whatsapp',
      sender: property.managerWhatsApp || 'Tenant',
      content: 'Property is looking great, thanks for the update.',
      date: moment().subtract(1, 'day').toISOString()
    }
  ];

  res.json(messages);
}

export async function getDocuments(req, res) {
  const realm = req.realm;
  const propertyId = req.params.id;

  const property = await Collections.Property.findOne({
    _id: propertyId,
    realmId: realm._id
  }).lean();

  if (!property) {
    return res.sendStatus(404);
  }

  // Mock Folder Sync
  // In a real scenario, this would use fs.readdir on property.localFolderPath
  const documents = [
    { name: 'property_main.jpg', type: 'image', date: moment().subtract(10, 'days').toISOString() },
    { name: 'lease_agreement.pdf', type: 'pdf', date: moment().subtract(20, 'days').toISOString() }
  ];

  res.json(documents);
}
