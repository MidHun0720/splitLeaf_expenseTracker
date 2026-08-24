import React from 'react';
import { useNavigate } from 'react-router-dom';
import './GroupCard.css';

const GroupCard = ({ group }) => {
  const navigate = useNavigate();

  return (
    <div className="group-card" onClick={() => navigate(`/groups/${group._id}`)}>
      <h3 className="group-card__title">{group.name}</h3>
      <p className="group-card__subtitle">
        <span className="group-card__icon">👥</span>
        {group.members?.length || 0} members
      </p>
    </div>
  );
};

export default GroupCard;
