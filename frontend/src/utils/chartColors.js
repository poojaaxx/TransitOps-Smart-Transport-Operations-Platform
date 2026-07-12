// Validated categorical palette (fixed order — never cycle/reassign by rank).
export const CATEGORICAL = {
  blue: '#2a78d6',
  aqua: '#1baf7a',
  yellow: '#eda100',
  green: '#008300',
  violet: '#4a3aa7',
  red: '#e34948',
  magenta: '#e87ba4',
  orange: '#eb6834',
};

export const CATEGORICAL_DARK = {
  blue: '#3987e5',
  aqua: '#199e70',
  yellow: '#c98500',
  green: '#008300',
  violet: '#9085e9',
  red: '#e66767',
  magenta: '#d55181',
  orange: '#d95926',
};

// Status colors are reserved for state — never reused as a generic series color.
export const STATUS = {
  good: '#0ca30c',
  warning: '#fab219',
  serious: '#ec835a',
  critical: '#d03b3b',
};

// Fixed hue assignment per domain value so identity never shifts when a filter
// changes which series are present.
export const VEHICLE_STATUS_COLORS = {
  Available: CATEGORICAL.aqua,
  'On Trip': CATEGORICAL.blue,
  'In Shop': CATEGORICAL.yellow,
  Retired: '#898781',
};

export const TRIP_STATUS_COLORS = {
  Draft: '#898781',
  Dispatched: CATEGORICAL.blue,
  Completed: CATEGORICAL.aqua,
  Cancelled: CATEGORICAL.red,
};

export const CHART_INK = {
  secondary: '#52514e',
  muted: '#898781',
  grid: '#e1e0d9',
};
