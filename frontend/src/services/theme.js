export const THEMES = [
  {
    id: 'mist',
    label: 'Mist',
    description: 'Light & airy',
    swatch: { bg: '#F8F7F4', accent: '#5b7c99' },
  },
  {
    id: 'rose',
    label: 'Rose',
    description: 'Warm blush',
    swatch: { bg: '#FAF4F1', accent: '#9B6A78' },
  },
  {
    id: 'midnight',
    label: 'Midnight',
    description: 'Deep blue',
    swatch: { bg: '#0C1018', accent: '#5B8FD4' },
  },
  {
    id: 'dusk',
    label: 'Dusk',
    description: 'Amber warmth',
    swatch: { bg: '#18120C', accent: '#C8924A' },
  },
  {
    id: 'forest',
    label: 'Forest',
    description: 'Cool sage',
    swatch: { bg: '#0E1510', accent: '#6BA07A' },
  },
]

export const getTheme = () => localStorage.getItem('cs-theme') || 'mist'

export const applyTheme = (id) => {
  document.documentElement.setAttribute('data-theme', id)
}

export const setTheme = (id) => {
  localStorage.setItem('cs-theme', id)
  applyTheme(id)
}
