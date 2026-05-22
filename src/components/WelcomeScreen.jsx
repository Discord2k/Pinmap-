import React from 'react';
import { T } from '../utils/styles';

var e = React.createElement;

export var WELCOME_KEY = 'pm-welcome-v1';

var ROWS = [
  {
    icon: '📍',
    title: 'Drop & Tag',
    desc: 'Pin any spot with a name, photos, and tags. Your personal map, organized your way.',
    highlight: false
  },
  {
    icon: '#',
    title: 'Hashtags — No Other Map Does This',
    desc: 'Tag every pin with #hashtags. Search any tag to find what others have pinned worldwide. Follow the tags you love. Social media meets the map.',
    highlight: true
  },
  {
    icon: '🔒',
    title: 'Your Privacy, Your Rules',
    desc: "Public for everyone, Private for just you, or Insider — for those in the know. If they know what to search, they'll find it.",
    highlight: false
  },
  {
    icon: '🔍',
    title: 'Discover',
    desc: 'Browse public pins near you, search by hashtag, and find spots within miles of you.',
    highlight: false
  },
  {
    icon: '🥾',
    title: 'Trails & Quests',
    desc: 'Record routes, import GPS tracks, and take on Explorer Quests.',
    highlight: false
  }
];

export function WelcomeScreen(props) {
  var onDone = props.onDone;

  function dismiss() {
    try { localStorage.setItem(WELCOME_KEY, '1'); } catch(err) {}
    onDone();
  }

  return e('div', {
    style: {
      position: 'fixed', inset: 0, zIndex: 9500,
      background: T.paper,
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto',
      animation: 'fadeIn 0.3s ease both'
    }
  },

    // ── Header ────────────────────────────────────────────────────
    e('div', {
      style: {
        background: T.forest2,
        padding: 'calc(env(safe-area-inset-top,0px) + 20px) 22px 18px',
        flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 10
      }
    },
      e('svg', { width: 22, height: 28, viewBox: '0 0 28 36' },
        e('path', { d: 'M14 0 C 6.27 0 0 6.27 0 14 c 0 9.5 14 22 14 22 s 14 -12.5 14 -22 C 28 6.27 21.73 0 14 0 z', fill: 'rgba(246,241,228,0.9)' }),
        e('circle', { cx: '14', cy: '14', r: '5', fill: T.forest2 })
      ),
      e('div', null,
        e('div', { style: { fontSize: 16, fontWeight: 700, letterSpacing: 3, color: T.paper, fontFamily: T.font } }, 'PINMAP'),
        e('div', { style: { fontSize: 10, color: 'rgba(246,241,228,0.6)', letterSpacing: 0.5 } }, '© Seth Gray')
      )
    ),

    // ── Hero text ─────────────────────────────────────────────────
    e('div', { style: { padding: '28px 24px 20px', flexShrink: 0, textAlign: 'center' } },
      e('div', { style: { fontSize: 26, fontWeight: 800, color: T.forest, letterSpacing: '-0.5px', fontFamily: T.font, marginBottom: 8 } },
        'Welcome to PINMAP'
      ),
      e('div', { style: { fontSize: 15, color: T.ink2, fontStyle: 'italic', fontFamily: T.font } },
        'The social map built around you.'
      )
    ),

    // ── Feature rows ──────────────────────────────────────────────
    e('div', { style: { flex: 1, padding: '0 0 8px' } },
      ROWS.map(function(row, i) {
        return e('div', {
          key: i,
          style: {
            display: 'flex', alignItems: 'flex-start', gap: 14,
            padding: '16px 22px',
            borderTop: i === 0 ? '1px solid ' + T.borderSoft : 'none',
            borderBottom: '1px solid ' + T.borderSoft,
            background: row.highlight ? '#fdf8ec' : 'transparent'
          }
        },
          // Icon box
          e('div', {
            style: {
              width: 42, height: 42, flexShrink: 0,
              borderRadius: 10,
              border: '1.5px solid ' + (row.highlight ? '#d4af37' : T.border),
              background: row.highlight ? '#fffbef' : T.paper2,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: row.icon === '#' ? 22 : 20,
              fontWeight: row.icon === '#' ? 800 : 400,
              color: row.highlight ? '#b8860b' : T.forest,
              fontFamily: row.icon === '#' ? T.mono : 'inherit'
            }
          }, row.icon),

          // Text
          e('div', { style: { flex: 1, minWidth: 0 } },
            e('div', {
              style: {
                fontSize: 14, fontWeight: 700,
                color: row.highlight ? '#7a5c00' : T.ink,
                marginBottom: 4, fontFamily: T.font,
                lineHeight: 1.3
              }
            }, row.title),
            e('div', {
              style: {
                fontSize: 13, color: T.ink3,
                lineHeight: 1.6, fontFamily: T.font
              }
            }, row.desc)
          )
        );
      })
    ),

    // ── Buttons ───────────────────────────────────────────────────
    e('div', {
      style: {
        padding: '16px 22px calc(env(safe-area-inset-bottom,0px) + 20px)',
        flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10
      }
    },
      e('button', {
        onClick: dismiss,
        style: {
          width: '100%', padding: '15px',
          background: T.forest, border: 'none', borderRadius: 12,
          color: T.paper, fontSize: 16, fontWeight: 700,
          cursor: 'pointer', fontFamily: T.font,
          letterSpacing: '0.02em',
          boxShadow: '0 4px 16px rgba(42,93,60,0.3)'
        }
      }, "Let's Go →"),
      e('button', {
        onClick: dismiss,
        style: {
          background: 'none', border: 'none', color: T.ink3,
          fontSize: 13, cursor: 'pointer', fontFamily: T.font, padding: '4px'
        }
      }, 'Skip')
    )
  );
}
