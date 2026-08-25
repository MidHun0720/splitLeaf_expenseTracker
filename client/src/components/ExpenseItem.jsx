import React from 'react';
import './ExpenseItem.css';

const CATEGORY_ICONS = {
  Food: '🍔',
  Groceries: '🛒',
  Transport: '🚗',
  Utilities: '💡',
  Entertainment: '🎬',
  Shopping: '🛍️',
  General: '📝'
};

const ExpenseItem = ({ expense, onEdit, onDelete, isOwner }) => {
  const categoryName = expense.category || 'General';
  const categoryIcon = CATEGORY_ICONS[categoryName] || '📝';
  const expenseDate = expense.date 
    ? new Date(expense.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <div className="expense-item">
      <div className="expense-item__left">
        <div className="expense-item__icon-wrapper" title={categoryName}>
          <span className="expense-item__category-icon">{categoryIcon}</span>
        </div>
        <div className="expense-item__details">
          <div className="expense-item__description">{expense.description}</div>
          <div className="expense-item__meta">
            <span className="expense-item__category-badge">{categoryName}</span>
            {expenseDate && <span className="expense-item__date">{expenseDate}</span>}
          </div>
        </div>
      </div>
      <div className="expense-item__right">
        <div className="expense-item__amount-section">
          <div className="expense-item__amount">₹{Number(expense.totalAmount).toFixed(2)}</div>
          <div className="expense-item__paid-by">Paid by {expense.paidBy?.name || 'Unknown'}</div>
        </div>
        {isOwner && (
          <div className="expense-item__actions">
            <button className="expense-item__action-btn" onClick={() => onEdit(expense)} title="Edit">✏️</button>
            <button className="expense-item__action-btn expense-item__action-btn--delete" onClick={() => onDelete(expense)} title="Delete">🗑️</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseItem;
