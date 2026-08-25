import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import ExpenseItem from '../components/ExpenseItem';
import BalanceItem, { DebtItem } from '../components/BalanceItem';
import './GroupDetail.css';

const CATEGORIES = [
  { id: 'All', label: 'All' },
  { id: 'Food', label: '🍔 Food' },
  { id: 'Groceries', label: '🛒 Groceries' },
  { id: 'Transport', label: '🚗 Transport' },
  { id: 'Utilities', label: '💡 Utilities' },
  { id: 'Entertainment', label: '🎬 Entertainment' },
  { id: 'Shopping', label: '🛍️ Shopping' },
  { id: 'General', label: '📝 General' }
];

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

  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('General');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseSplit, setExpenseSplit] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const [newMemberEmail, setNewMemberEmail] = useState('');
  
  const [settleTo, setSettleTo] = useState('');
  const [settleAmount, setSettleAmount] = useState('');

  const computeDebts = (balancesMap, membersList = []) => {
    const memberMap = {};
    membersList.forEach(m => {
      if (m && m._id) memberMap[m._id.toString()] = m;
    });

    const debtors = [];
    const creditors = [];

    for (const [userId, net] of Object.entries(balancesMap || {})) {
      const rounded = Math.round(Number(net) * 100) / 100;
      if (rounded < -0.01) {
        debtors.push({ userId, amount: -rounded });
      } else if (rounded > 0.01) {
        creditors.push({ userId, amount: rounded });
      }
    }

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const calculatedDebts = [];
    let dIdx = 0;
    let cIdx = 0;

    const debtorList = debtors.map(d => ({ ...d }));
    const creditorList = creditors.map(c => ({ ...c }));

    while (dIdx < debtorList.length && cIdx < creditorList.length) {
      const debtor = debtorList[dIdx];
      const creditor = creditorList[cIdx];
      const settleAmount = Math.min(debtor.amount, creditor.amount);

      if (settleAmount > 0.01) {
        const roundedAmount = Math.round(settleAmount * 100) / 100;
        calculatedDebts.push({
          from: debtor.userId,
          fromUser: memberMap[debtor.userId] || { _id: debtor.userId, name: 'Member', email: '' },
          to: creditor.userId,
          toUser: memberMap[creditor.userId] || { _id: creditor.userId, name: 'Member', email: '' },
          amount: roundedAmount
        });
      }

      debtor.amount -= settleAmount;
      creditor.amount -= settleAmount;

      if (debtor.amount < 0.01) dIdx++;
      if (creditor.amount < 0.01) cIdx++;
    }

    return calculatedDebts;
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [groupRes, expensesRes, balancesRes, settlementsRes] = await Promise.all([
        API.get(`/groups/${groupId}`),
        API.get(`/expenses/group/${groupId}`),
        API.get(`/expenses/group/${groupId}/balances`),
        API.get(`/settlements/group/${groupId}`)
      ]);
      
      const groupData = groupRes.data;
      setGroup(groupData);
      setExpenses(expensesRes.data || []);
      
      let parsedBalances = {};
      let parsedDebts = [];

      if (balancesRes.data) {
        if (balancesRes.data.balances && Array.isArray(balancesRes.data.debts)) {
          parsedBalances = balancesRes.data.balances;
          parsedDebts = balancesRes.data.debts;
        } else {
          parsedBalances = balancesRes.data;
        }
      }

      if (parsedDebts.length === 0 && Object.keys(parsedBalances).length > 0) {
        parsedDebts = computeDebts(parsedBalances, groupData?.members || []);
      }

      setBalances(parsedBalances);
      setDebts(parsedDebts);
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
    setExpenseCategory('General');
    setExpenseDate(new Date().toISOString().split('T')[0]);
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
        category: expenseCategory,
        date: expenseDate,
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

  const exportToCSV = () => {
    if (expenses.length === 0) {
      alert('No expenses to export');
      return;
    }

    const headers = ['Date', 'Description', 'Category', 'Amount (INR)', 'Paid By', 'Split Among'];
    const rows = expenses.map(exp => {
      const dateStr = exp.date ? new Date(exp.date).toLocaleDateString('en-IN') : '';
      const desc = `"${(exp.description || '').replace(/"/g, '""')}"`;
      const cat = exp.category || 'General';
      const amount = Number(exp.totalAmount || 0).toFixed(2);
      const paidBy = `"${(exp.paidBy?.name || '').replace(/"/g, '""')}"`;
      const splitList = Array.isArray(exp.splitAmong) 
        ? exp.splitAmong.map(m => m?.name || '').join(', ')
        : '';
      const split = `"${splitList.replace(/"/g, '""')}"`;

      return [dateStr, desc, cat, amount, paidBy, split].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${group.name.replace(/\s+/g, '_')}_expenses.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const filteredExpenses = expenses.filter(exp => {
    const matchesCategory = selectedCategory === 'All' || (exp.category || 'General') === selectedCategory;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || 
      exp.description?.toLowerCase().includes(query) ||
      exp.paidBy?.name?.toLowerCase().includes(query) ||
      (exp.category || 'General').toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

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
          {expenses.length > 0 && (
            <button className="btn-secondary" onClick={exportToCSV} title="Download CSV Report">
              📥 Export CSV
            </button>
          )}
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
              <h2>Group Expenses</h2>
              <button className="btn-primary" onClick={openAddExpense}>+ Add Expense</button>
            </div>

            {expenses.length > 0 && (
              <div className="expense-toolbar">
                <input 
                  type="text" 
                  className="input-primary expense-search-input" 
                  placeholder="🔍 Search by description, paid by, or category..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                <div className="category-filter-pills">
                  {CATEGORIES.map(cat => (
                    <button 
                      key={cat.id}
                      type="button"
                      className={`category-pill ${selectedCategory === cat.id ? 'category-pill--active' : ''}`}
                      onClick={() => setSelectedCategory(cat.id)}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="expense-list">
              {expenses.length === 0 ? (
                <div className="empty-notice">
                  <p className="text-muted">No expenses recorded yet. Add one above to split the cost!</p>
                </div>
              ) : filteredExpenses.length === 0 ? (
                <div className="empty-notice">
                  <p className="text-muted">No expenses match your search or filter.</p>
                </div>
              ) : (
                filteredExpenses.map(exp => (
                  <ExpenseItem 
                    key={exp._id} 
                    expense={exp} 
                    isOwner={isCurrentUser(exp.paidBy)}
                    onEdit={() => {
                      setEditingExpense(exp);
                      setExpenseDesc(exp.description);
                      setExpenseAmount(exp.totalAmount);
                      setExpenseCategory(exp.category || 'General');
                      setExpenseDate(exp.date ? new Date(exp.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
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
                    <p className="settlement-amount">₹{Number(settle.amount).toFixed(2)}</p>
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
            <label className="field-label">Category</label>
            <select 
              className="input-primary"
              value={expenseCategory}
              onChange={e => setExpenseCategory(e.target.value)}
            >
              <option value="Food">🍔 Food & Dining</option>
              <option value="Groceries">🛒 Groceries</option>
              <option value="Transport">🚗 Transportation</option>
              <option value="Utilities">💡 Utilities & Bills</option>
              <option value="Entertainment">🎬 Entertainment</option>
              <option value="Shopping">🛍️ Shopping</option>
              <option value="General">📝 General</option>
            </select>
          </div>
          <div>
            <label className="field-label">Expense Date</label>
            <input 
              type="date"
              className="input-primary"
              value={expenseDate}
              onChange={e => setExpenseDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="field-label">Total Amount (₹)</label>
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
            <label className="field-label">Amount (₹)</label>
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
