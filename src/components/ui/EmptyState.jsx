import React from 'react';
import { T } from '../../utils/styles';

export function EmptyState({ icon, title, description, actionLabel, onAction }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 20px',
      textAlign: 'center'
    }}>
      {icon && (
        <div style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          background: T.forestPale,
          color: T.forest,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20
        }}>
          {icon}
        </div>
      )}
      
      <div style={{fontSize: 18, fontWeight: 700, color: T.ink, marginBottom: 8}}>{title}</div>
      
      {description && (
        <div style={{fontSize: 13, color: T.ink3, marginBottom: actionLabel ? 24 : 0, maxWidth: 280, lineHeight: 1.5}}>
          {description}
        </div>
      )}
      
      {actionLabel && onAction && (
        <button 
          className="pm-action-btn"
          onClick={onAction}
          style={{
            background: T.forest,
            color: T.paper,
            border: 'none',
            borderRadius: 14,
            padding: '12px 24px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(42,93,60,0.15)',
            transition: 'transform 0.1s, box-shadow 0.1s',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
          onMouseDown={e => {
            e.currentTarget.style.transform = 'scale(0.96)';
            e.currentTarget.style.boxShadow = '0 2px 6px rgba(42,93,60,0.1)';
          }}
          onMouseUp={e => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(42,93,60,0.15)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(42,93,60,0.15)';
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
