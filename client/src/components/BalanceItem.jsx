import React from 'react';
import './BalanceItem.css';

const BalanceItem = ({ name, amount }) => {
  const isPositive = amount > 0;
  const isNegative = amount < 0;
  const isZero = amount === 0;

  let displayAmount = '';
  let amountClass = 'balance-item__amount--zero';

  if (isPositive) {
    displayAmount = `+$${amount.toFixed(2)}`;
    amountClass = 'balance-item__amount--positive';
  } else if (isNegative) {
    displayAmount = `-$${Math.abs(amount).toFixed(2)}`;
    amountClass = 'balance-item__amount--negative';
  } else {
    displayAmount = 'Settled up';
  }

  return (
    <div className="balance-item">
      <div className="balance-item__name">{name}</div>
      <div className={`balance-item__amount ${amountClass}`}>
        {displayAmount}
      </div>
    </div>
  );
};

export default BalanceItem;
