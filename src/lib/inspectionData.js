// Static data for the vehicle inspection screen (from the paper checklist).
// UI only - nothing here talks to the backend.

export const TOOLS = [
  { id: 'or_cr', label: 'OR and CR' },
  { id: 'car_jack', label: 'Car Jack' },
  { id: 'tire_wrench', label: 'Tire Wrench' },
  { id: 'spare_tire', label: 'Spare Tire' },
  { id: 'warning_device', label: 'Early Warning Device' },
  { id: 'car_matting', label: 'Car Matting' },
  { id: 'rain_visor', label: 'Rain Visor' },
  { id: 'seat_cover', label: 'Seat Cover' },
  { id: 'umbrella', label: 'Umbrella' },
  { id: 'freshener', label: 'Freshener' },
  { id: 'hub_cap', label: 'Hub Cap' },
]

export const TOOL_STATUSES = [
  { id: 'present', label: 'Present' },
  { id: 'missing', label: 'Missing' },
  { id: 'damaged', label: 'Damaged' },
]

// The paper form uses "GC" twice (Glass Chip and Gouges/Creases).
// `id` is unique and used in the data; `code` is what staff see on screen.
export const DAMAGE_CODES = [
  { id: 'SH', code: 'SH', label: 'Swirls/Holograms' },
  { id: 'WS', code: 'WS', label: 'Water Spots' },
  { id: 'OX', code: 'OX', label: 'Oxidation' },
  { id: 'CF', code: 'CF', label: 'Clearcoat Failure' },
  { id: 'DS', code: 'DS', label: 'Deep Scratch' },
  { id: 'BD', code: 'BD', label: 'Bird Dropping' },
  { id: 'RP', code: 'RP', label: 'Rough Paint' },
  { id: 'UD', code: 'UD', label: 'Unknown Defect' },
  { id: 'PT', code: 'PT', label: 'Paint Transfer' },
  { id: 'PC', code: 'PC', label: 'Paint Chip' },
  { id: 'GS', code: 'GS', label: 'Glass Scratch' },
  { id: 'GC_GLASS', code: 'GC', label: 'Glass Chip' },
  { id: 'DD', code: 'DD', label: 'Dents/Dings' },
  { id: 'SS', code: 'SS', label: 'Side Swipe' },
  { id: 'CR', code: 'CR', label: 'Curb Rash' },
  { id: 'WD', code: 'WD', label: 'Wheel Damage' },
  { id: 'GC_GOUGE', code: 'GC', label: 'Gouges/Creases' },
]

export const damageById = Object.fromEntries(DAMAGE_CODES.map((d) => [d.id, d]))

export const FUEL_LEVELS = ['Empty', '1/4', '1/2', '3/4', 'Full']

// Tappable parts of the top-view car (drawing area is 260 x 440, front at the top).
// cx/cy is where damage markers are drawn.
// stack: 'v' stacks several markers vertically on narrow parts.
// hit: extra tap area (in drawing units) around small parts like mirrors.
export const ZONES = [
  { id: 'front_bumper', label: 'Front bumper', shape: 'rect', x: 66, y: 12, w: 128, h: 30, r: 14, cx: 130, cy: 27 },
  { id: 'hood', label: 'Hood', shape: 'path', d: 'M74 46 L186 46 L192 130 L68 130 Z', cx: 130, cy: 90 },
  { id: 'windshield', label: 'Windshield', shape: 'poly', points: '86,134 174,134 168,184 92,184', cx: 130, cy: 159 },
  { id: 'roof', label: 'Roof', shape: 'rect', x: 92, y: 188, w: 76, h: 82, r: 8, cx: 130, cy: 229 },
  { id: 'rear_glass', label: 'Rear glass', shape: 'poly', points: '92,274 168,274 174,324 86,324', cx: 130, cy: 299 },
  { id: 'trunk', label: 'Trunk', shape: 'path', d: 'M68 328 L192 328 L186 398 L74 398 Z', cx: 130, cy: 363 },
  { id: 'rear_bumper', label: 'Rear bumper', shape: 'rect', x: 66, y: 402, w: 128, h: 26, r: 12, cx: 130, cy: 415 },

  { id: 'door_lf', label: 'Left front door', shape: 'rect', x: 44, y: 134, w: 40, h: 96, r: 6, cx: 64, cy: 182, stack: 'v' },
  { id: 'door_lr', label: 'Left rear door', shape: 'rect', x: 44, y: 234, w: 40, h: 90, r: 6, cx: 64, cy: 279, stack: 'v' },
  { id: 'door_rf', label: 'Right front door', shape: 'rect', x: 176, y: 134, w: 40, h: 96, r: 6, cx: 196, cy: 182, stack: 'v' },
  { id: 'door_rr', label: 'Right rear door', shape: 'rect', x: 176, y: 234, w: 40, h: 90, r: 6, cx: 196, cy: 279, stack: 'v' },

  { id: 'mirror_l', label: 'Left side mirror', shape: 'rect', x: 28, y: 126, w: 18, h: 11, r: 5, cx: 37, cy: 131, hit: 7 },
  { id: 'mirror_r', label: 'Right side mirror', shape: 'rect', x: 214, y: 126, w: 18, h: 11, r: 5, cx: 223, cy: 131, hit: 7 },

  { id: 'wheel_lf', label: 'Left front wheel', kind: 'wheel', shape: 'circle', rad: 22, cx: 26, cy: 92, stack: 'v' },
  { id: 'wheel_rf', label: 'Right front wheel', kind: 'wheel', shape: 'circle', rad: 22, cx: 234, cy: 92, stack: 'v' },
  { id: 'wheel_lr', label: 'Left rear wheel', kind: 'wheel', shape: 'circle', rad: 22, cx: 26, cy: 350, stack: 'v' },
  { id: 'wheel_rr', label: 'Right rear wheel', kind: 'wheel', shape: 'circle', rad: 22, cx: 234, cy: 350, stack: 'v' },
]

export const zoneById = Object.fromEntries(ZONES.map((z) => [z.id, z]))
