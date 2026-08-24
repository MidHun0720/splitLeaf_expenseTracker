import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import ExpenseItem from '../components/ExpenseItem';
import BalanceItem, { DebtItem } from '../components/BalanceItem';
import './GroupDetail.css';

const GroupDetail = () => {
  const { groupId } = useParams();
  const { user } = useAuth();
  
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState({});
  const [debts, setDebts] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [activeTab, setActiveTab] = useState('expenses');
  
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  
  // Expense Form State
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseSplit, setExpenseSplit] = useState([]);
  
  // Member Form State
  const [newMemberEmail, setNewMemberEmail] = useState('');
  
  // Settle Form State
  const [settleTo, setSettleTo] = useState('');
  const [settleAmount, setSettleAmount] = useState('');

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [groupRes, expensesRes, balancesRes, settlementsRes] = await Promise.all([
        API.get(`/groups/${groupId}`),
        API.get(`/expenses/group/${groupId}`),
        API.get(`/expenses/group/${groupId}/balances`),
        API.get(`/settlements/group/${groupId}`)
      ]);
      
      setGroup(groupRes.data);
      setExpenses(expensesRes.data || []);
      
      if (balancesRes.data) {
        if (balancesRes.data.balances && balancesRes.data.debts) {
          setBalances(balancesRes.data.balances);
          setDebts(balancesRes.data.debts);
        } else {
          setBalances(balancesRes.data);
          setDebts([]);
        }
      }
      
      setSettlements(settlementsRes.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to fetch group data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [groupId]);

  const openAddExpense = () => {
    setEditingExpense(null);
    setExpenseDesc('');
    setExpenseAmount('');
    setExpenseSplit(group?.members?.map(m => m._id) || []);
    setShowExpenseModal(true);
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    if (expenseSplit.length === 0) {
      alert('Please select at least one member to split the expense with.');
      return;
    }

    try {
      const payload = {
        group: groupId,
        description: expenseDesc,
        totalAmount: Number(expenseAmount),
        splitAmong: expenseSplit
      };
      
      if (editingExpense) {
        await API.put(`/expenses/${editingExpense._id}`, payload);
      } else {
        await API.post('/expenses/create', payload);
      }
      setShowExpenseModal(false);
      fetchAllData();
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.err || err.response?.data?.message || 'Failed to save expense');
    }
  };

  const handleDeleteExpense = async (exp) => {
    const expenseId = typeof exp === 'object' ? exp._id : exp;
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await API.delete(`/expenses/${expenseId}`);
        fetchAllData();
      } catch (err) {
        alert(err.response?.data?.error || err.response?.data?.message || 'Failed to delete expense');
      }
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await API.post(`/groups/${groupId}/add-member`, { email: newMemberEmail });
      setShowMemberModal(false);
      setNewMemberEmail('');
      fetchAllData();
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (member) => {
    if (!isCreator) {
      alert('Only the person who created the group can kick members.');
      return;
    }
    if (isMemberCreator(member)) {
      alert('The group creator cannot be removed from the group.');
      return;
    }

    if (window.confirm(`Are you sure you want to kick ${member.name} (${member.email}) from the group?`)) {
      try {
        await API.post(`/groups/${groupId}/remove-member`, { email: member.email });
        fetchAllData();
      } catch (err) {
        alert(err.response?.data?.error || err.response?.data?.message || 'Failed to remove member');
      }
    }
  };

  const handleQuickSettle = (targetUserId, amount) => {
    setSettleTo(targetUserId);
    setSettleAmount(amount);
    setShowSettleModal(true);
  };

  const handleSettleUp = async (e) => {
    e.preventDefault();
    try {
      await API.post('/settlements/create', {
        group: groupId,
        to: settleTo,
        amount: Number(settleAmount)
      });
      setShowSettleModal(false);
      setSettleTo('');
      setSettleAmount('');
      fetchAllData();
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.err || err.response?.data?.message || 'Failed to settle up');
    }
  };

  const toggleSplitMember = (memberId) => {
    setExpenseSplit(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const isCurrentUser = (memberOrId) => {
    if (!user) return false;
    const currentUserId = user.id || user._id;
    if (typeof memberOrId === 'object' && memberOrId !== null) {
      return (
        memberOrId._id === currentUserId ||
        (user.email && memberOrId.email === user.email)
      );
    }
    return memberOrId === currentUserId;
  };

  const isMemberCreator = (member) => {
    if (!group || !member) return false;
    if (group.createdBy) {
      const creatorId = typeof group.createdBy === 'object' ? group.createdBy._id : group.createdBy;
      return member._id === creatorId;
    }
    return group.members?.[0]?._id === member._id;
  };

  const isCreator = Boolean(
    group?.createdBy
      ? (typeof group.createdBy === 'object' 
          ? isCurrentUser(group.createdBy) 
          : (group.createdBy === user?.id || group.createdBy === user?._id))
      : (group?.members?.length > 0 && isCurrentUser(group.members[0]))
  );

  if (loading) return <div className="group-detail__loading">Loading group details...</div>;
  if (error) return <div className="group-detail__error">{error}</div>;
  if (!group) return null;

  return (
    <div className="group-detail">
      <div className="group-detail__header">
        <div>
          <h1>{group.name}</h1>
          <p className="text-muted">{group.members?.length || 0} members</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={() => setShowMemberModal(true)}>+ Add Member</button>
          <Link to="/dashboard" className="btn-secondary">← Back to Groups</Link>
        </div>
      </div>

      <div className="group-detail__tabs">
        <button 
          className={`group-detail__tab ${activeTab === 'expenses' ? 'group-detail__tab--active' : ''}`}
          onClick={() => setActiveTab('expenses')}
        >
          Expenses ({expenses.length})
        </button>
        <button 
          className={`group-detail__tab ${activeTab === 'balances' ? 'group-detail__tab--active' : ''}`}
          onClick={() => setActiveTab('balances')}
        >
          Balances {debts.length > 0 && `(${debts.length} pending)`}
        </button>
        <button 
          className={`group-detail__tab ${activeTab === 'settlements' ? 'group-detail__tab--active' : ''}`}
          onClick={() => setActiveTab('settlements')}
        >
          Settlements ({settlements.length})
        </button>
      </div>

      <div className="group-detail__tab-content">
        {activeTab === 'expenses' && (
          <div>
            <div className="group-detail__section-header">
              <h2>Recent Expenses</h2>
              <button className="btn-primary" onClick={openAddExpense}>+ Add Expense</button>
            </div>
            <div className="expense-list">
              {expenses.length === 0 ? (
                <div className="empty-notice">
                  <p className="text-muted">No expenses recorded yet. Add one above to split the cost!</p>
                </div>
              ) : (
                expenses.map(exp => (
                  <ExpenseItem 
                    key={exp._id} 
                    expense={exp} 
                    isOwner={isCurrentUser(exp.paidBy)}
                    onEdit={() => {
                      setEditingExpense(exp);
                      setExpenseDesc(exp.description);
                      setExpenseAmount(exp.totalAmount);
                      setExpenseSplit(
                        Array.isArray(exp.splitAmong)
                          ? exp.splitAmong.map(s => (typeof s === 'object' ? s._id : s))
                          : []
                      );
                      setShowExpenseModal(true);
                    }}
                    onDelete={handleDeleteExpense}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'balances' && (
          <div>
            <div className="group-detail__section-header">
              <h2>Who Owes Who</h2>
              <button className="btn-primary" onClick={() => setShowSettleModal(true)}>Settle Up</button>
            </div>
            
            <div className="debts-container">
              {debts.length === 0 ? (
                <div className="empty-notice">
                  <p className="text-muted">🎉 All debts are settled! Nobody owes anyone in this group.</p>
                </div>
              ) : (
                <div className="debt-list">
                  {debts.map((debt, index) => (
                    <DebtItem 
                      key={`${debt.from}-${debt.to}-${index}`} 
                      debt={debt} 
                      currentUserId={user?.id || user?._id}
                      onSettle={handleQuickSettle}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="net-balances-section">
              <h3 className="section-subtitle">Net Balances Summary</h3>
              <div className="balance-list">
                {Object.keys(balances).length === 0 ? (
                  <p className="text-muted">No balances to display.</p>
                ) : (
                  Object.entries(balances).map(([userId, amount]) => {
                    const member = group.members?.find(m => m._id === userId);
                    if (!member) return null;
                    return (
                      <BalanceItem 
                        key={userId} 
                        name={member.name} 
                        amount={amount} 
                        isYou={isCurrentUser(member)}
                      />
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settlements' && (
          <div>
            <div className="group-detail__section-header">
              <h2>Settlement History</h2>
              <button className="btn-primary" onClick={() => setShowSettleModal(true)}>Settle Up</button>
            </div>
            <div className="settlement-list">
              {settlements.length === 0 ? (
                <div className="empty-notice">
                  <p className="text-muted">No settlements yet. Record a payment whenever someone settles a debt.</p>
                </div>
              ) : (
                settlements.map(settle => (
                  <div key={settle._id} className="settlement-card">
                    <p><strong>{settle.from?.name || 'Someone'}</strong> paid <strong>{settle.to?.name || 'Someone'}</strong></p>
                    <p className="settlement-amount">${Number(settle.amount).toFixed(2)}</p>
                    <p className="text-muted text-sm">{new Date(settle.date).toLocaleDateString()}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="group-detail__members card mt-4">
        <div className="group-detail__members-header">
          <h3>Group Members ({group.members?.length || 0})</h3>
          {isCreator && <span className="badge-admin">You are the Group Creator</span>}
        </div>
        <div className="member-list">
          {group.members?.map(member => {
            const isMemberGroupCreator = isMemberCreator(member);
            const isYou = isCurrentUser(member);
            return (
              <div key={member._id} className="group-detail__member-item">
                <div className="member-info">
                  <strong>{member.name}</strong>{' '}
                  <span className="text-muted">({member.email})</span>
                  {isMemberGroupCreator && <span className="badge-creator"> 👑 Creator</span>}
                  {isYou && <span className="badge-you"> (You)</span>}
                </div>
                {isCreator && !isMemberGroupCreator && !isYou && (
                  <button 
                    className="btn-danger-small" 
                    onClick={() => handleRemoveMember(member)}
                    title={`Kick ${member.name} from group`}
                  >
                    &times;
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Expense Modal */}
      <Modal 
        isOpen={showExpenseModal} 
        onClose={() => setShowExpenseModal(false)} 
        title={editingExpense ? "Edit Expense" : "Add Expense"}
      >
        <form className="modal-form" onSubmit={handleExpenseSubmit}>
          <div>
            <label className="field-label">Description</label>
            <input 
              type="text" 
              className="input-primary" 
              placeholder="e.g. Groceries, Team Lunch, Utilities" 
              value={expenseDesc} 
              onChange={e => setExpenseDesc(e.target.value)} 
              required 
            />
          </div>
          <div>
            <label className="field-label">Total Amount ($)</label>
            <input 
              type="number" 
              step="0.01" 
              min="0.01"
              className="input-primary" 
              placeholder="0.00" 
              value={expenseAmount} 
              onChange={e => setExpenseAmount(e.target.value)} 
              required 
            />
          </div>
          <div className="split-among">
            <h4>Split equally among:</h4>
            {group.members?.map(member => (
              <label key={member._id} className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={expenseSplit.includes(member._id)}
                  onChange={() => toggleSplitMember(member._id)}
                />
                {member.name} {isCurrentUser(member) ? '(You)' : ''}
              </label>
            ))}
          </div>
          <button type="submit" className="btn-primary">
            {editingExpense ? "Save Changes" : "Add Expense"}
          </button>
        </form>
      </Modal>

      {/* Member Modal */}
      <Modal 
        isOpen={showMemberModal} 
        onClose={() => setShowMemberModal(false)} 
        title="Add Member to Group"
      >
        <form className="modal-form" onSubmit={handleAddMember}>
          <div>
            <label className="field-label">Registered User Email</label>
            <input 
              type="email" 
              className="input-primary" 
              placeholder="user@example.com" 
              value={newMemberEmail} 
              onChange={e => setNewMemberEmail(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="btn-primary">Add to Group</button>
        </form>
      </Modal>

      {/* Settle Modal */}
      <Modal 
        isOpen={showSettleModal} 
        onClose={() => setShowSettleModal(false)} 
        title="Settle Up Payment"
      >
        <form className="modal-form" onSubmit={handleSettleUp}>
          <div>
            <label className="field-label">Pay To</label>
            <select 
              className="input-primary" 
              value={settleTo} 
              onChange={e => setSettleTo(e.target.value)} 
              required
            >
              <option value="">Select person...</option>
              {group.members?.filter(m => !isCurrentUser(m)).map(member => (
                <option key={member._id} value={member._id}>{member.name} ({member.email})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Amount ($)</label>
            <input 
              type="number" 
              step="0.01" 
              min="0.01"
              className="input-primary" 
              placeholder="0.00" 
              value={settleAmount} 
              onChange={e => setSettleAmount(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="btn-primary">Record Settlement</button>
        </form>
      </Modal>
    </div>
  );
};

export default GroupDetail;
