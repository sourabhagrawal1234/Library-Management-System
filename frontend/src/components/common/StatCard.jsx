import React from 'react';

const StatCard = ({ title, value, icon: Icon, color = 'blue', subtext = null }) => {
  const colorMap = {
    blue: { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', iconBg: '#dbeafe' },
    green: { bg: '#ecfdf5', border: '#a7f3d0', text: '#059669', iconBg: '#d1fae5' },
    amber: { bg: '#fffbeb', border: '#fde68a', text: '#d97706', iconBg: '#fef3c7' },
    red: { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', iconBg: '#fee2e2' },
    purple: { bg: '#faf5ff', border: '#e9d5ff', text: '#7e22ce', iconBg: '#f3e8ff' }
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div className="stat-card" style={{ borderLeft: `4px solid ${scheme.text}` }}>
      <div className="stat-icon" style={{ backgroundColor: scheme.iconBg, color: scheme.text }}>
        {Icon && <Icon size={26} />}
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{title}</div>
        {subtext && (
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '3px' }}>
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
