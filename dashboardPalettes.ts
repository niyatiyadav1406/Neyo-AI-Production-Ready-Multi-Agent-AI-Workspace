export type DashboardPalette = {
  lightBackground: string
  darkBackground: string
  lightGlow: string
  darkGlow: string
  accent: string
}

export const DASHBOARD_PALETTES: DashboardPalette[] = [
  {
    lightBackground: 'linear-gradient(135deg, rgba(255, 154, 158, 0.22), rgba(250, 208, 196, 0.2), rgba(255, 236, 210, 0.18))',
    darkBackground: 'linear-gradient(135deg, rgba(120, 38, 78, 0.35), rgba(57, 31, 91, 0.32), rgba(17, 24, 39, 0.3))',
    lightGlow: 'rgba(255, 120, 140, 0.22)',
    darkGlow: 'rgba(255, 133, 162, 0.18)',
    accent: '#ff7aa2',
  },
  {
    lightBackground: 'linear-gradient(135deg, rgba(137, 247, 254, 0.2), rgba(102, 166, 255, 0.22), rgba(224, 195, 252, 0.18))',
    darkBackground: 'linear-gradient(135deg, rgba(16, 68, 99, 0.34), rgba(29, 78, 216, 0.28), rgba(88, 28, 135, 0.26))',
    lightGlow: 'rgba(84, 160, 255, 0.22)',
    darkGlow: 'rgba(96, 165, 250, 0.18)',
    accent: '#5b9cff',
  },
  {
    lightBackground: 'linear-gradient(135deg, rgba(132, 250, 176, 0.22), rgba(143, 211, 244, 0.2), rgba(191, 246, 228, 0.16))',
    darkBackground: 'linear-gradient(135deg, rgba(15, 90, 68, 0.34), rgba(14, 116, 144, 0.28), rgba(22, 78, 99, 0.24))',
    lightGlow: 'rgba(80, 220, 170, 0.22)',
    darkGlow: 'rgba(74, 222, 128, 0.16)',
    accent: '#40c98b',
  },
  {
    lightBackground: 'linear-gradient(135deg, rgba(253, 251, 251, 0.1), rgba(235, 237, 238, 0.06), rgba(253, 219, 146, 0.22))',
    darkBackground: 'linear-gradient(135deg, rgba(92, 45, 145, 0.3), rgba(58, 28, 113, 0.32), rgba(20, 20, 34, 0.3))',
    lightGlow: 'rgba(255, 191, 92, 0.22)',
    darkGlow: 'rgba(250, 204, 21, 0.18)',
    accent: '#f3b34f',
  },
]

function hashString(value: string): number {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }

  return hash
}

export function getPreviewPalette(seed: string): DashboardPalette {
  const index = hashString(seed) % DASHBOARD_PALETTES.length
  return DASHBOARD_PALETTES[index] ?? DASHBOARD_PALETTES[0]!
}
