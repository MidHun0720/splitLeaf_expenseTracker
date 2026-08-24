import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import Modal from '../components/Modal';
import GroupCard from '../components/GroupCard';
import './Dashboard.css';

const Dashboard = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const navigate = useNavigate();

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await API.get('/groups/my-groups');
      setGroups(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to fetch groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      await API.post('/groups/create', { name: newGroupName });
      setShowModal(false);
      setNewGroupName('');
      fetchGroups();
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.message || 'Failed to create group');
    }
  };

  if (loading) {
    return <div className="dashboard__loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <h1 className="dashboard__title">Your Groups</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          New Group
        </button>
      </div>

      {error && <div className="dashboard__error">{error}</div>}

      {groups.length === 0 ? (
        <div className="dashboard__empty">
          <div className="dashboard__empty-icon">📂</div>
          <p>No groups yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="dashboard__grid">
          {groups.map((group) => (
            <GroupCard
              key={group._id}
              group={group}
              onClick={() => navigate(`/groups/${group._id}`)}
            />
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Group">
        <form className="dashboard__form" onSubmit={handleCreateGroup}>
          <input
            type="text"
            className="input-primary"
            placeholder="Group Name"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary">
            Create Group
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Dashboard;
