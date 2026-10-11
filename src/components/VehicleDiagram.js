import { View } from 'react-native'
import Svg, { Rect, Polygon, Path, G, Circle, Text as SvgText } from 'react-native-svg'
import { useAppTheme } from '../context/ThemeContext'
import { ZONES, damageById } from '../lib/inspectionData'

// The shape of one tappable car part.
function ZoneShape({ zone, ...props }) {
  if (zone.shape === 'poly') return <Polygon points={zone.points} strokeLinejoin="round" {...props} />
  if (zone.shape === 'path') return <Path d={zone.d} strokeLinejoin="round" {...props} />
  if (zone.shape === 'circle') return <Circle cx={zone.cx} cy={zone.cy} r={zone.rad} {...props} />
  return <Rect x={zone.x} y={zone.y} width={zone.w} height={zone.h} rx={zone.r ?? 0} {...props} />
}

// Top-view car, drawn like the paper checklist. Tap a part to report damage there.
//   marks      - damage marks for this inspection: [{ zone, code }]
//   ghostMarks - marks from the PRE inspection, shown as dashed circles on POST
//   onZonePress(zoneId)
export default function VehicleDiagram({ marks, ghostMarks = [], onZonePress }) {
  const { colors } = useAppTheme()
  const line = colors.textFaint

  // Real marks first, then PRE marks that are not repeated in this inspection.
  const items = [
    ...marks.map((m) => ({ ...m, ghost: false })),
    ...ghostMarks
      .filter((g) => !marks.some((m) => m.zone === g.zone && m.code === g.code))
      .map((g) => ({ ...g, ghost: true })),
  ]

  const byZone = {}
  items.forEach((item) => {
    if (!byZone[item.zone]) byZone[item.zone] = []
    byZone[item.zone].push(item)
  })

  const wheels = ZONES.filter((z) => z.kind === 'wheel')
  const bodyZones = ZONES.filter((z) => z.kind !== 'wheel')

  function zoneProps(zone) {
    const marked = !!byZone[zone.id]?.some((i) => !i.ghost)
    const isWheel = zone.kind === 'wheel'
    const isMirror = zone.id.startsWith('mirror')
    return {
      fill: marked ? colors.danger : isWheel || isMirror ? line : colors.bgSurface2,
      fillOpacity: marked ? 0.3 : isWheel ? 0.4 : isMirror ? 0.55 : 1,
      stroke: line,
      strokeWidth: 1.5,
    }
  }

  return (
    <View style={{ width: '100%', maxWidth: 340, aspectRatio: 260 / 440, alignSelf: 'center' }}>
      <Svg width="100%" height="100%" viewBox="0 0 260 440">
        {/* Wheels sit behind the body, like the paper form */}
        {wheels.map((zone) => (
          <ZoneShape key={zone.id} zone={zone} {...zoneProps(zone)} />
        ))}
        <G pointerEvents="none">
          {wheels.map((zone) => (
            <G key={`ring-${zone.id}`}>
              <Circle cx={zone.cx} cy={zone.cy} r={zone.rad - 8} fill="none" stroke={line} strokeWidth={1.2} />
              <Circle cx={zone.cx} cy={zone.cy} r={4} fill={line} />
            </G>
          ))}
        </G>

        {/* Car body outline */}
        <Rect x={44} y={14} width={172} height={414} rx={52} fill={colors.bgSurface} stroke={line} strokeWidth={1.5} pointerEvents="none" />

        {/* Tappable body parts */}
        {bodyZones.map((zone) => (
          <ZoneShape key={zone.id} zone={zone} {...zoneProps(zone)} />
        ))}

        {/* Drawing details (not tappable): lights, hood lines, door windows, seats, steering wheel */}
        <G pointerEvents="none">
          <Rect x={74} y={18} width={20} height={8} rx={4} fill={colors.warning} fillOpacity={0.5} />
          <Rect x={166} y={18} width={20} height={8} rx={4} fill={colors.warning} fillOpacity={0.5} />
          <Rect x={74} y={408} width={20} height={8} rx={4} fill={colors.warning} fillOpacity={0.5} />
          <Rect x={166} y={408} width={20} height={8} rx={4} fill={colors.warning} fillOpacity={0.5} />

          <Path d="M104 54 L106 124 M156 54 L154 124" stroke={line} strokeWidth={1} strokeOpacity={0.6} fill="none" />
          <Path d="M104 336 L106 392 M156 336 L154 392" stroke={line} strokeWidth={1} strokeOpacity={0.6} fill="none" />

          {ZONES.filter((z) => z.id.startsWith('door_')).map((z) => {
            const left = z.id.startsWith('door_l')
            return (
              <Rect
                key={`win-${z.id}`}
                x={left ? z.x + 8 : z.x + 6}
                y={z.y + 10}
                width={26}
                height={z.h - 20}
                rx={5}
                fill={line}
                fillOpacity={0.22}
                stroke={line}
                strokeWidth={1}
              />
            )
          })}

          <Rect x={98} y={200} width={26} height={30} rx={7} fill="none" stroke={line} strokeWidth={1} strokeOpacity={0.7} />
          <Rect x={136} y={200} width={26} height={30} rx={7} fill="none" stroke={line} strokeWidth={1} strokeOpacity={0.7} />
          <Rect x={98} y={238} width={64} height={26} rx={7} fill="none" stroke={line} strokeWidth={1} strokeOpacity={0.7} />
          <Circle cx={111} cy={194} r={6} fill="none" stroke={line} strokeWidth={1} strokeOpacity={0.9} />
        </G>

        {/* Tap layer: invisible copies of every part, on top of the drawing details,
            so a tap always reaches the part underneath. Wheels first so doors win where they overlap. */}
        {[...wheels, ...bodyZones].map((zone) => {
          const tap = { fill: colors.bgVoid, fillOpacity: 0.01, onPress: () => onZonePress(zone.id) }
          return zone.hit ? (
            // Bigger tap area for small parts such as mirrors
            <Rect key={`tap-${zone.id}`} x={zone.x - zone.hit} y={zone.y - zone.hit} width={zone.w + zone.hit * 2} height={zone.h + zone.hit * 2} {...tap} />
          ) : (
            <ZoneShape key={`tap-${zone.id}`} zone={zone} {...tap} />
          )
        })}

        {/* Side labels */}
        <SvgText x={8} y={236} fontSize="11" fill={colors.textMuted} textAnchor="middle" pointerEvents="none">L</SvgText>
        <SvgText x={252} y={236} fontSize="11" fill={colors.textMuted} textAnchor="middle" pointerEvents="none">R</SvgText>

        {/* Damage markers */}
        {ZONES.map((zone) => {
          const list = byZone[zone.id]
          if (!list) return null
          const n = list.length
          return list.map((item, i) => {
            const offset = (i - (n - 1) / 2) * 24
            const x = zone.stack === 'v' ? zone.cx : zone.cx + offset
            const y = zone.stack === 'v' ? zone.cy + offset : zone.cy
            const code = damageById[item.code]?.code ?? item.code
            return (
              <G key={`${zone.id}-${item.code}-${item.ghost ? 'g' : 'm'}`} onPress={() => onZonePress(zone.id)}>
                {item.ghost ? (
                  <Circle cx={x} cy={y} r={11} fill={colors.bgSurface} stroke={colors.warning} strokeWidth={1.5} strokeDasharray="3 3" />
                ) : (
                  <Circle cx={x} cy={y} r={11} fill={colors.danger} />
                )}
                <SvgText
                  x={x}
                  y={y + 3.5}
                  fontSize="9.5"
                  fontWeight="bold"
                  fill={item.ghost ? colors.warning : 'white'}
                  textAnchor="middle"
                >
                  {code}
                </SvgText>
              </G>
            )
          })
        })}
      </Svg>
    </View>
  )
}
