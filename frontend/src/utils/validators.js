/**
 * Real-time form validation rules for Finora
 */

export const validateRequired = (value, fieldName = "Field") => {
  if (!value || (typeof value === "string" && value.trim() === "")) {
    return `${fieldName} is required.`;
  }
  return null;
};

export const validatePositiveNumber = (value, fieldName = "Amount") => {
  const num = Number(value);
  if (isNaN(num) || num <= 0) {
    return `${fieldName} must be a positive number greater than zero.`;
  }
  return null;
};

export const validateTransactionForm = (formData) => {
  const errors = {};
  
  const amountError = validatePositiveNumber(formData.amount, "Amount");
  if (amountError) errors.amount = amountError;

  const categoryError = validateRequired(formData.category, "Category");
  if (categoryError) errors.category = categoryError;

  const merchantError = validateRequired(formData.merchant, "Title / Merchant");
  if (merchantError) errors.merchant = merchantError;

  const walletError = validateRequired(formData.walletId, "Wallet");
  if (walletError) errors.walletId = walletError;

  return errors;
};

export const validateWalletForm = (formData) => {
  const errors = {};
  
  const nameError = validateRequired(formData.name, "Wallet Name");
  if (nameError) errors.name = nameError;

  if (formData.balance === "" || isNaN(Number(formData.balance))) {
    errors.balance = "Please enter a valid initial balance (can be negative for credit cards).";
  }

  return errors;
};

export const validateBudgetForm = (formData) => {
  const errors = {};

  const categoryError = validateRequired(formData.category, "Category");
  if (categoryError) errors.category = categoryError;

  const limitError = validatePositiveNumber(formData.limit, "Budget Limit");
  if (limitError) errors.limit = limitError;

  return errors;
};

export const validateGoalForm = (formData) => {
  const errors = {};

  const titleError = validateRequired(formData.title, "Goal Title");
  if (titleError) errors.title = titleError;

  const targetError = validatePositiveNumber(formData.targetAmount, "Target Amount");
  if (targetError) errors.targetAmount = targetError;

  const deadlineError = validateRequired(formData.deadline, "Target Date");
  if (deadlineError) errors.deadline = deadlineError;

  return errors;
};
