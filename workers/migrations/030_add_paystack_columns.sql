-- Add Paystack reference columns to shop_payments table
ALTER TABLE shop_payments ADD COLUMN providerReference TEXT;
ALTER TABLE shop_payments ADD COLUMN providerAccessCode TEXT;
ALTER TABLE shop_payments ADD COLUMN providerTransactionId TEXT;
ALTER TABLE shop_payments ADD COLUMN verifiedAt TEXT;
