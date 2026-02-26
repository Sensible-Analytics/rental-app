function categorizeDocument(text = "") {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('bescom') || lowerText.includes('electricity') || lowerText.includes('jharkhand bijli')) return 'ELECTRICITY_BILL';
  if (lowerText.includes('mahanagar gas') || lowerText.includes('gas bill')) return 'GAS_BILL';
  if (lowerText.includes('bank statement') || lowerText.includes('account summary') || lowerText.includes('funds/securities balance')) return 'BANK_STATEMENT';
  if (lowerText.includes('rental agreement') || lowerText.includes('lease agreement')) return 'RENTAL_AGREEMENT';
  return 'UNKNOWN';
}

module.exports = { categorizeDocument };
