import React from 'react';
import './BalanceItem.css';

export const DebtItem = ({ debt, currentUserId, onSettle }) => {
  const isYouDebtor = debt.from === currentUserId || debt.fromUser?._id === currentUserId;
  const isYouCreditor = debt.to === currentUserId || debt.toUser?._id === currentUserId;

  return (
    <div className={`debt-item ${isYouDebtor ? 'debt-item--you-owe' : isYouCreditor ? 'debt-item--you-are-owed' : ''}`}>
      <div className="debt-item__info">
        <div className="debt-item__statement">
          <span className={`debt-item__person ${isYouDebtor ? 'debt-item__person--you' : ''}`}>
            {isYouDebtor ? 'You' : (debt.fromUser?.name || 'Member')}
          </span>
          <span className="debt-item__owes">{isYouDebtor ? ' owe ' : ' owes '}</span>
          <span className={`debt-item__person ${isYouCreditor ? 'debt-item__person--you' : ''}`}>
            {isYouCreditor ? 'You' : (debt.toUser?.name || 'Member')}
          </span>
        </div>
        {debt.fromUser?.email && debt.toUser?.email && (
          <div className="debt-item__email text-muted text-sm">
            {debt.fromUser.email} → {debt.toUser.email}
          </div>
        )}
      </div>
      
      <div className="debt-item__action">
        <span className="debt-item__amount">₹{Number(debt.amount).toFixed(2)}</span>
        {isYouDebtor && onSettle && (
          <button 
            type="button"
            className="btn-settle-mini"
            onClick={() => onSettle(debt.to, debt.amount)}
            title="Settle up this debt"
          >
            Settle
          </button>
        )}
      </div>
    </div>
  );
};

const BalanceItem = ({ name, amount, isYou }) => {
  const isPositive = amount > 0;
  const isNegative = amount < 0;

  let displayAmount = '';
  let amountClass = 'balance-item__amount--zero';
  let statusText = 'Settled up';

  if (isPositive) {
    displayAmount = `+₹${amount.toFixed(2)}`;
    amountClass = 'balance-item__amount--positive';
    statusText = 'gets back in total';
  } else if (isNegative) {
    displayAmount = `-₹${Math.abs(amount).toFixed(2)}`;
    amountClass = 'balance-item__amount--negative';
    statusText = 'owes in total';
  }

  return (
    <div className="balance-item">
      <div className="balance-item__name">
        {name} {isYou && <span className="badge-you">(You)</span>}
        <span className="balance-item__status text-muted text-sm"> — {statusText}</span>
      </div>
      <div className={`balance-item__amount ${amountClass}`}>
        {displayAmount}
      </div>
    </div>
  );
};

export default BalanceItem;
