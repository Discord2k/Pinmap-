/**
 * badges.js
 * Premium gamification badges for PINMAP.
 * Designed to align with the application's cartographic, warm-paper aesthetic.
 * 
 * Aesthetic Rationale:
 * - Unlocked states use highly curated pastel backgrounds and high-contrast text tones 
 *   matching the badge theme. This preserves readability (WCAG AA compliant) while maintaining elegance.
 * - Locked states use desaturated paper-like hues (#f5f3ed bg, #e1ded6 border, #9aa097 text)
 *   to blend naturally with the retro atlas theme, avoiding stark, metallic modern grays.
 */

export const BADGE_TIERS = {
  PINS: [1, 10, 50, 100],
  CHECKINS: [1, 5, 15, 35]
};

export const BADGES = [
  // --- PLACING PINS BADGES ---
  {
    id: "pins_1",
    type: "pins",
    threshold: 1,
    emoji: "🌱",
    title: "Pioneer Sprout",
    description: "Placed your first pin and marked your spot on the globe.",
    colors: {
      unlocked: {
        bg: "#eaf2ec",     // Soft sage green
        border: "#c7dacb", // Sage border
        text: "#1f4a30"    // Deep forest green
      },
      locked: {
        bg: "#f5f3ed",     // Muted parchment
        border: "#e1ded6", // Muted warm border
        text: "#9aa097"    // Ink4 (muted gray)
      }
    }
  },
  {
    id: "pins_10",
    type: "pins",
    threshold: 10,
    emoji: "🧭",
    title: "Trailblazer",
    description: "Mapped 10 locations. Your personal atlas is taking shape.",
    colors: {
      unlocked: {
        bg: "#fdf3e7",     // Warm peach/ochre
        border: "#f6dec3", // Soft terracotta border
        text: "#824c13"    // Deep earth/clay
      },
      locked: {
        bg: "#f5f3ed",
        border: "#e1ded6",
        text: "#9aa097"
      }
    }
  },
  {
    id: "pins_50",
    type: "pins",
    threshold: 50,
    emoji: "🏔️",
    title: "Atlas Builder",
    description: "Placed 50 pins. A detailed chronicle of your geographical footprint.",
    colors: {
      unlocked: {
        bg: "#eef5fc",     // Alpine ice blue
        border: "#cee1f7", // Soft sky border
        text: "#1a4773"    // Deep cobalt/navy
      },
      locked: {
        bg: "#f5f3ed",
        border: "#e1ded6",
        text: "#9aa097"
      }
    }
  },
  {
    id: "pins_100",
    type: "pins",
    threshold: 100,
    emoji: "👑",
    title: "Apex Explorer",
    description: "Placed 100 pins. Your mark on the world is vast and enduring.",
    colors: {
      unlocked: {
        bg: "#fdf9e2",     // Royal cream
        border: "#f8ebaf", // Antique gold border
        text: "#6c5607"    // Deep royal gold/bronze
      },
      locked: {
        bg: "#f5f3ed",
        border: "#e1ded6",
        text: "#9aa097"
      }
    }
  },

  // --- CHECK-IN BADGES ---
  {
    id: "checkin_1",
    type: "checkins",
    threshold: 1,
    emoji: "👋",
    title: "Curious Nomad",
    description: "Checked in to another user's pin for the first time.",
    colors: {
      unlocked: {
        bg: "#f5f0fa",     // Pale lavender
        border: "#e3d4f3", // Soft lavender border
        text: "#552e85"    // Deep violet
      },
      locked: {
        bg: "#f5f3ed",
        border: "#e1ded6",
        text: "#9aa097"
      }
    }
  },
  {
    id: "checkin_5",
    type: "checkins",
    threshold: 5,
    emoji: "🍻",
    title: "Local Regular",
    description: "Visited 5 spots shared by others. Stepping into the community.",
    colors: {
      unlocked: {
        bg: "#fef0f2",     // Blush rose
        border: "#fcd3d9", // Rose border
        text: "#7d1f2b"    // Deep rosewood/crimson
      },
      locked: {
        bg: "#f5f3ed",
        border: "#e1ded6",
        text: "#9aa097"
      }
    }
  },
  {
    id: "checkin_15",
    type: "checkins",
    threshold: 15,
    emoji: "🎒",
    title: "Vagabond Companion",
    description: "Checked in 15 times. Connecting the dots between local stories.",
    colors: {
      unlocked: {
        bg: "#e9f7f6",     // Soft teal
        border: "#c2ebe8", // Mint border
        text: "#105e58"    // Deep pine teal
      },
      locked: {
        bg: "#f5f3ed",
        border: "#e1ded6",
        text: "#9aa097"
      }
    }
  },
  {
    id: "checkin_35",
    type: "checkins",
    threshold: 35,
    emoji: "⚜️",
    title: "Great Connector",
    description: "Checked in 35 times. A celebrated regular of the Pin Map community.",
    colors: {
      unlocked: {
        bg: "#faf0f7",     // Soft orchid/plum
        border: "#f1d4eb", // Muted plum border
        text: "#6c215c"    // Deep aubergine
      },
      locked: {
        bg: "#f5f3ed",
        border: "#e1ded6",
        text: "#9aa097"
      }
    }
  }
];

const BADGE_TRANSLATIONS = {
  es: {
    pins_1: {
      title: "Brote Pionero",
      description: "Colocaste tu primer pin y marcaste tu lugar en el globo."
    },
    pins_10: {
      title: "Pionero de Rutas",
      description: "Mapeaste 10 ubicaciones. Tu atlas personal está tomando forma."
    },
    pins_50: {
      title: "Creador de Atlas",
      description: "Colocaste 50 pines. Una crónica detallada de tu huella geográfica."
    },
    pins_100: {
      title: "Explorador Supremo",
      description: "Colocaste 100 pines. Tu marca en el mundo es vasta y duradera."
    },
    checkin_1: {
      title: "Nómada Curioso",
      description: "Registraste tu visita en el pin de otro usuario por primera vez."
    },
    checkin_5: {
      title: "Habitual del Lugar",
      description: "Visitaste 5 lugares compartidos por otros. Entrando en la comunidad."
    },
    checkin_15: {
      title: "Compañero de Viaje",
      description: "Registraste 15 visitas. Conectando los puntos entre historias locales."
    },
    checkin_35: {
      title: "Gran Conector",
      description: "Registraste 35 visitas. Un miembro célebre de la comunidad de Pin Map."
    }
  }
};

/**
 * Checks which badges are unlocked for a user based on their stats.
 * @param {number} pinsCount - Number of pins placed by the user
 * @param {number} checkinsCount - Number of check-ins to other users' pins
 * @param {string} lang - The active language code ('en' or 'es')
 * @returns {Array} Array of badges with their unlock status
 */
export function getBadgesStatus(pinsCount, checkinsCount, lang) {
  return BADGES.map(function(badge) {
    var isUnlocked = badge.type === 'pins' 
      ? pinsCount >= badge.threshold 
      : checkinsCount >= badge.threshold;
    var localized = badge;
    if (lang === 'es' && BADGE_TRANSLATIONS.es[badge.id]) {
      localized = Object.assign({}, badge, BADGE_TRANSLATIONS.es[badge.id]);
    }
    return Object.assign({}, localized, { unlocked: isUnlocked });
  });
}
