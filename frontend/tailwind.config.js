/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Deutsche Geschäfts-Farb-Palette (Ampelsystem)
      colors: {
        // Primäre Geschäfts-Farben
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e'
        },
        
        // Deutsche Ampelsystem-Farben
        ampel: {
          gruen: {
            50: '#f0fdf4',
            100: '#dcfce7',
            200: '#bbf7d0',
            300: '#86efac',
            400: '#4ade80',
            500: '#22c55e',
            600: '#16a34a',
            700: '#15803d',
            800: '#166534',
            900: '#14532d'
          },
          gelb: {
            50: '#fffbeb',
            100: '#fef3c7',
            200: '#fde68a',
            300: '#fcd34d',
            400: '#fbbf24',
            500: '#f59e0b',
            600: '#d97706',
            700: '#b45309',
            800: '#92400e',
            900: '#78350f'
          },
          orange: {
            50: '#fff7ed',
            100: '#ffedd5',
            200: '#fed7aa',
            300: '#fdba74',
            400: '#fb923c',
            500: '#f97316',
            600: '#ea580c',
            700: '#c2410c',
            800: '#9a3412',
            900: '#7c2d12'
          },
          rot: {
            50: '#fef2f2',
            100: '#fee2e2',
            200: '#fecaca',
            300: '#fca5a5',
            400: '#f87171',
            500: '#ef4444',
            600: '#dc2626',
            700: '#b91c1c',
            800: '#991b1b',
            900: '#7f1d1d'
          }
        },

        // Deutsche Geschäfts-Grautöne
        geschaeft: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a'
        }
      },

      // Deutsche Typografie
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'display': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace']
      },

      // Deutsche Geschäfts-Spacing
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem'
      },

      // Deutsche Responsive Breakpoints
      screens: {
        'xs': '375px',   // Mobile
        'sm': '640px',   // Tablet Portrait
        'md': '768px',   // Tablet Landscape
        'lg': '1024px',  // Desktop
        'xl': '1280px',  // Large Desktop
        '2xl': '1536px', // Extra Large Desktop
        
        // Deutsche Geschäfts-spezifische Breakpoints
        'mobile': '375px',
        'tablet': '768px',
        'desktop': '1024px',
        'dashboard': '1280px'
      },

      // Animation für deutsche UX
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounceSubtle 0.6s ease-out'
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' }
        }
      },

      // Deutsche Geschäfts-Schatten
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'dashboard': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'ampel': '0 0 0 3px rgba(59, 130, 246, 0.1)'
      },

      // Deutsche Geschäfts-Border-Radius
      borderRadius: {
        'card': '0.5rem',
        'button': '0.375rem',
        'input': '0.375rem'
      },

      // Deutsche Geschäfts-Transitions
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'ease-out-back': 'cubic-bezier(0.34, 1.56, 0.64, 1)'
      }
    }
  },
  plugins: [
    // Plugin für deutsche Geschäfts-Utilities
    function({ addUtilities, theme }) {
      const newUtilities = {
        // Deutsche Währungsformatierung
        '.currency-display': {
          fontFamily: theme('fontFamily.mono'),
          fontWeight: '600',
          letterSpacing: '0.025em'
        },
        
        // Ampelsystem-Indikatoren
        '.ampel-gruen': {
          backgroundColor: theme('colors.ampel.gruen.500'),
          color: 'white',
          borderColor: theme('colors.ampel.gruen.600')
        },
        '.ampel-gelb': {
          backgroundColor: theme('colors.ampel.gelb.500'),
          color: 'white',
          borderColor: theme('colors.ampel.gelb.600')
        },
        '.ampel-orange': {
          backgroundColor: theme('colors.ampel.orange.500'),
          color: 'white',
          borderColor: theme('colors.ampel.orange.600')
        },
        '.ampel-rot': {
          backgroundColor: theme('colors.ampel.rot.500'),
          color: 'white',
          borderColor: theme('colors.ampel.rot.600')
        },

        // Deutsche Geschäfts-Karten
        '.geschaeft-card': {
          backgroundColor: 'white',
          borderRadius: theme('borderRadius.card'),
          boxShadow: theme('boxShadow.card'),
          border: `1px solid ${theme('colors.geschaeft.200')}`,
          transition: 'all 0.2s ease-in-out'
        },
        '.geschaeft-card:hover': {
          boxShadow: theme('boxShadow.card-hover'),
          transform: 'translateY(-1px)'
        },

        // Deutsche Formular-Elemente
        '.input-german': {
          borderRadius: theme('borderRadius.input'),
          borderColor: theme('colors.geschaeft.300'),
          fontSize: '0.875rem',
          fontWeight: '400',
          '&:focus': {
            borderColor: theme('colors.primary.500'),
            boxShadow: `0 0 0 3px ${theme('colors.primary.100')}`
          }
        },

        // Deutsche Button-Stile
        '.btn-primary': {
          backgroundColor: theme('colors.primary.600'),
          color: 'white',
          borderRadius: theme('borderRadius.button'),
          fontWeight: '600',
          fontSize: '0.875rem',
          padding: '0.5rem 1rem',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: theme('colors.primary.700'),
            transform: 'translateY(-1px)',
            boxShadow: theme('boxShadow.card-hover')
          }
        }
      }
      
      addUtilities(newUtilities)
    }
  ]
}