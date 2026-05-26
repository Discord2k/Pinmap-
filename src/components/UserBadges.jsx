import React from 'react';
import { getBadgesStatus } from '../utils/badges';

export function UserBadges(props) {
  var pinsCount = props.pinsCount || 0;
  var checkinsCount = props.checkinsCount || 0;
  var trailsCount = props.trailsCount || 0;
  var mappacksCount = props.mappacksCount || 0;
  var challengesCount = props.challengesCount || 0;
  var lang = props.lang || 'en';
  var t = props.t || function(key) { return key; };
  var flash = props.flash || function(){};

  var badgeStatuses = getBadgesStatus(pinsCount, checkinsCount, trailsCount, mappacksCount, challengesCount, lang);



  return (
    <div style={{ padding: '16px 0' }}>
      <h4 style={{ 
        fontSize: '11px', 
        letterSpacing: '0.15em', 
        color: '#6f786f', 
        textTransform: 'uppercase', 
        marginBottom: '12px', 
        fontWeight: 600, 
        fontFamily: "'JetBrains Mono', ui-monospace, monospace" 
      }}>
        {t('achievements')}
      </h4>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', 
        gap: '12px' 
      }}>
        {badgeStatuses.map(function(badge) {
          var state = badge.unlocked ? 'unlocked' : 'locked';
          var colors = badge.colors[state];
          
          return (
            <div 
              key={badge.id} 
              style={{
                background: colors.bg,
                border: "1px solid " + colors.border,
                borderRadius: '12px',
                padding: '12px',
                textAlign: 'center',
                opacity: badge.unlocked ? 1 : 0.65,
                transition: 'all 0.2s ease-in-out',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: badge.unlocked ? '0 1px 3px rgba(28,32,28,0.04)' : 'none',
                position: 'relative'
              }}
              title={badge.title + ": " + badge.description}
            >
              {/* Badge Icon (Emoji) */}
              <div 
                style={{ 
                  fontSize: '28px', 
                  marginBottom: '8px',
                  filter: badge.unlocked ? 'none' : 'grayscale(100%) opacity(0.5)',
                  transform: badge.unlocked ? 'scale(1)' : 'scale(0.95)',
                  transition: 'transform 0.2s ease'
                }}
              >
                {badge.emoji}
              </div>

              {/* Title */}
              <div 
                style={{ 
                  fontWeight: 600, 
                  fontSize: '12.5px', 
                  color: colors.text, 
                  lineHeight: 1.25,
                  marginBottom: '4px'
                }}
              >
                {badge.title}
              </div>

              {/* Threshold Description */}
              <div 
                style={{ 
                  fontSize: '9.5px', 
                  color: colors.text, 
                  opacity: 0.75,
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                {badge.type === 'pins' 
                  ? badge.threshold + " " + (lang === 'es' ? 'pin' + (badge.threshold > 1 ? 'es' : '') : 'pin' + (badge.threshold > 1 ? 's' : ''))
                  : badge.type === 'checkins'
                    ? badge.threshold + " " + (lang === 'es' ? 'visita' + (badge.threshold > 1 ? 's' : '') : 'check-in' + (badge.threshold > 1 ? 's' : ''))
                    : badge.type === 'trails'
                      ? badge.threshold + " " + (lang === 'es' ? 'ruta' + (badge.threshold > 1 ? 's' : '') : 'route' + (badge.threshold > 1 ? 's' : ''))
                      : badge.type === 'mappacks'
                        ? badge.threshold + " " + (lang === 'es' ? 'guía' + (badge.threshold > 1 ? 's' : '') : 'guide' + (badge.threshold > 1 ? 's' : ''))
                        : badge.threshold + " " + (lang === 'es' ? 'desafío' + (badge.threshold > 1 ? 's' : '') : 'quest' + (badge.threshold > 1 ? 's' : ''))
                }
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
