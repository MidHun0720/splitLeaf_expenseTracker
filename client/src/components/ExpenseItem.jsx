import React from 'react';
import './ExpenseItem.css';

const ExpenseItem = ({ expense, onEdit, onDelete, isOwner }) => {
  return (
    <div className="expense-item">
      <div className="expense-item__left">
        <div className="expense-item__description">{expense.description}</div>
      </div>
      <div className="expense-item__right">
        <div className="expense-item__amount-section">
          <div className="expense-item__amount">${Number(expense.totalAmount).toFixed(2)}</div>
          <div className="expense-item__paid-by">Paid by: {expense.paidBy?.name || 'Unknown'}</div>
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
