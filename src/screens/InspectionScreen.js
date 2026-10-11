import { useState } from 'react'
import {
  View, Text, TextInput, Pressable, ScrollView, Alert, ActivityIndicator,
  Modal, KeyboardAvoidingView, Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../lib/api'
import { useAppTheme } from '../context/ThemeContext'
import VehicleDiagram from '../components/VehicleDiagram'
import {
  TOOLS, TOOL_STATUSES, DAMAGE_CODES, FUEL_LEVELS, damageById, zoneById,
} from '../lib/inspectionData'

const TABS = [
  { id: 'pre_rental', label: 'PRE', hint: 'Before rental' },
  { id: 'post_rental', label: 'POST', hint: 'After rental' },
]

// Same empty form for PRE and POST, so both tabs look identical.
const emptyForm = () => ({
  tools: {},            // { tool_id: 'present' | 'missing' | 'damaged' }
  marks: [],            // [{ zone, code }]
  odometer: '',
  fuel: 'Full',
  notes: '',
  fee: '',
  renterName: '',
  renterSigned: false,
  staffName: '',
  staffSigned: false,
})

/* ---------- small building blocks (kept outside the screen so inputs keep focus) ---------- */

function Card({ children }) {
  const { colors } = useAppTheme()
  return (
    <View style={{ backgroundColor: colors.bgSurface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 12 }}>
      {children}
    </View>
  )
}

function Title({ children, hint }) {
  const { colors } = useAppTheme()
  return (
    <View style={{ gap: 2 }}>
      <Text style={{ color: colors.textPrimary, fontSize: 16, fontWeight: '700' }}>{children}</Text>
      {hint ? <Text style={{ color: colors.textMuted, fontSize: 12 }}>{hint}</Text> : null}
    </View>
  )
}

function Field({ label, style, ...props }) {
  const { colors } = useAppTheme()
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: colors.textMuted, fontSize: 13 }}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textFaint}
        style={[
          { backgroundColor: colors.bgSurface2, color: colors.textPrimary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, borderWidth: 1, borderColor: colors.border },
          style,
        ]}
        {...props}
      />
    </View>
  )
}

function InfoRow({ label, value }) {
  const { colors } = useAppTheme()
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, gap: 12 }}>
      <Text style={{ color: colors.textMuted, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: colors.textPrimary, fontSize: 13, fontWeight: '600', flexShrink: 1, textAlign: 'right' }}>{value}</Text>
    </View>
  )
}

const STATUS_ICONS = { present: 'checkmark', missing: 'close', damaged: 'alert' }

function ToolRow({ tool, value, onChange }) {
  const { colors } = useAppTheme()
  const tint = { present: colors.success, missing: colors.danger, damaged: colors.warning }
  return (
    <View style={{ gap: 6, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: value ? tint[value] : colors.textFaint }} />
        <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '600' }}>{tool.label}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {TOOL_STATUSES.map((s) => {
          const selected = value === s.id
          return (
            <Pressable
              key={s.id}
              onPress={() => onChange(selected ? undefined : s.id)}
              style={{
                flex: 1, minHeight: 42, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1,
                backgroundColor: selected ? `${tint[s.id]}2e` : colors.bgSurface2,
                borderColor: selected ? tint[s.id] : colors.border,
              }}
            >
              <Ionicons name={STATUS_ICONS[s.id]} size={16} color={selected ? tint[s.id] : colors.textFaint} />
              <Text style={{ color: selected ? tint[s.id] : colors.textMuted, fontSize: 13, fontWeight: selected ? '700' : '500' }}>{s.label}</Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

// Legend drawn as a table, like the paper form: code | name
function LegendTable() {
  const { colors } = useAppTheme()
  return (
    <View style={{ borderWidth: 1, borderColor: colors.textFaint, borderRadius: 8, overflow: 'hidden' }}>
      {DAMAGE_CODES.map((d, i) => (
        <View
          key={d.id}
          style={{ flexDirection: 'row', borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.border, backgroundColor: i % 2 ? colors.bgSurface2 : 'transparent' }}
        >
          <Text style={{ width: 52, paddingVertical: 8, textAlign: 'center', color: colors.textPrimary, fontWeight: '800', fontSize: 13, borderRightWidth: 1, borderRightColor: colors.border }}>{d.code}</Text>
          <Text style={{ flex: 1, paddingVertical: 8, paddingHorizontal: 12, color: colors.textPrimary, fontSize: 13 }}>{d.label}</Text>
        </View>
      ))}
    </View>
  )
}

function SignatureBox({ title, name, onName, signed, onToggle }) {
  const { colors } = useAppTheme()
  return (
    <View style={{ gap: 10 }}>
      <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: '700' }}>{title}</Text>
      <Field label="Full name" value={name} onChangeText={onName} placeholder="Type full name" />
      <Pressable
        onPress={onToggle}
        style={{
          height: 84, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4,
          borderColor: signed ? colors.success : colors.textFaint,
          backgroundColor: signed ? `${colors.success}1a` : 'transparent',
        }}
      >
        <Ionicons name={signed ? 'checkmark-circle' : 'create-outline'} size={24} color={signed ? colors.success : colors.textMuted} />
        <Text style={{ color: signed ? colors.success : colors.textMuted, fontSize: 13, fontWeight: '600' }}>
          {signed ? 'Signed (tap to undo)' : 'Tap to sign'}
        </Text>
      </Pressable>
    </View>
  )
}

// Bottom sheet that opens when a car part is tapped.
// Tap a code to add it to that part, tap it again to remove it.
function DamageSheet({ zoneId, marks, onToggle, onClearZone, onClose }) {
  const { colors } = useAppTheme()
  const zone = zoneId ? zoneById[zoneId] : null
  const zoneMarks = marks.filter((m) => m.zone === zoneId)

  return (
    <Modal visible={!!zone} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <Pressable
          onPress={() => {}}
          style={{ backgroundColor: colors.bgSurface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '82%', gap: 12 }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '700' }}>{zone?.label}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>Tap the damage you see. Tap again to remove it.</Text>
            </View>
            <Pressable onPress={onClose} style={{ padding: 6 }}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 8 }}>
            {DAMAGE_CODES.map((d) => {
              const selected = zoneMarks.some((m) => m.code === d.id)
              return (
                <Pressable
                  key={d.id}
                  onPress={() => onToggle(zoneId, d.id)}
                  style={{
                    width: '48.5%', minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, borderRadius: 12, borderWidth: 1,
                    backgroundColor: selected ? `${colors.danger}26` : colors.bgSurface2,
                    borderColor: selected ? colors.danger : colors.border,
                  }}
                >
                  <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? colors.danger : colors.bgSurface }}>
                    <Text style={{ color: selected ? 'white' : colors.textPrimary, fontSize: 12, fontWeight: '800' }}>{d.code}</Text>
                  </View>
                  <Text style={{ color: colors.textPrimary, fontSize: 13, flex: 1 }}>{d.label}</Text>
                </Pressable>
              )
            })}
          </ScrollView>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            {zoneMarks.length > 0 && (
              <Pressable
                onPress={() => onClearZone(zoneId)}
                style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.danger }}
              >
                <Text style={{ color: colors.danger, fontWeight: '700' }}>Clear this part</Text>
              </Pressable>
            )}
            <Pressable onPress={onClose} style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: colors.nebula1 }}>
              <Text style={{ color: 'white', fontWeight: '700' }}>Done</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

/* ---------- the screen ---------- */

export default function InspectionScreen({ route, navigation }) {
  const { bookingId, type, job } = route.params
  const { colors } = useAppTheme()

  const [tab, setTab] = useState(type === 'post_rental' ? 'post_rental' : 'pre_rental')
  const [forms, setForms] = useState({ pre_rental: emptyForm(), post_rental: emptyForm() })
  const [activeZone, setActiveZone] = useState(null)
  const [busy, setBusy] = useState(false)

  const form = forms[tab]
  const tabLabel = tab === 'pre_rental' ? 'PRE' : 'POST'
  const update = (patch) => setForms((f) => ({ ...f, [tab]: { ...f[tab], ...patch } }))

  function setTool(toolId, status) {
    const tools = { ...form.tools }
    if (status) tools[toolId] = status
    else delete tools[toolId]
    update({ tools })
  }

  function toggleMark(zone, code) {
    const exists = form.marks.some((m) => m.zone === zone && m.code === code)
    update({
      marks: exists
        ? form.marks.filter((m) => !(m.zone === zone && m.code === code))
        : [...form.marks, { zone, code }],
    })
  }

  function clearZone(zone) {
    update({ marks: form.marks.filter((m) => m.zone !== zone) })
  }

  function clearAll() {
    Alert.alert(`Clear ${tabLabel} inspection?`, `Everything you entered in the ${tabLabel} tab will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => setForms((f) => ({ ...f, [tab]: emptyForm() })) },
    ])
  }

  async function submit() {
    setBusy(true)
    try {
      await api.post(`/bookings/${bookingId}/inspections`, {
        type: tab,
        // Same true/false format the backend already receives (Present = true).
        checklist: Object.fromEntries(TOOLS.map((t) => [t.label, form.tools[t.id] === 'present'])),
        odometer_reading: form.odometer ? Number(form.odometer) : null,
        fuel_level: form.fuel,
        damage_notes: form.notes,
        damage_fee: form.fee ? Number(form.fee) : 0,
        // NEW fields - the backend must be updated to store these.
        tools: Object.fromEntries(TOOLS.map((t) => [t.id, form.tools[t.id] ?? null])),
        damage_marks: form.marks.map((m) => ({ zone: m.zone, code: m.code, label: damageById[m.code]?.label })),
        renter_name: form.renterName,
        renter_signed: form.renterSigned,
        staff_name: form.staffName,
        staff_signed: form.staffSigned,
      })
    } catch (error) {
      setBusy(false)
      return Alert.alert('Error', error.message)
    }
    setBusy(false)
    Alert.alert('Inspection saved', `The ${tabLabel} inspection has been saved for this booking.`, [
      { text: 'OK', onPress: () => navigation.goBack() },
    ])
  }

  const vehicle = job?.vehicles
  const checkedCount = TOOLS.filter((t) => form.tools[t.id]).length

  // POST only: what is different from the PRE inspection filled in this session
  const pre = forms.pre_rental
  const newDamage = form.marks.filter((m) => !pre.marks.some((p) => p.zone === m.zone && p.code === m.code)).length
  const toolIssues = TOOLS.filter((t) => pre.tools[t.id] === 'present' && form.tools[t.id] && form.tools[t.id] !== 'present').length
  const showChanges = tab === 'post_rental' && (newDamage > 0 || toolIssues > 0)

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bgVoid }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12 }}>
        <Pressable onPress={() => navigation.goBack()} style={{ padding: 6 }}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '700' }}>Vehicle Inspection</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        {/* PRE / POST tabs */}
        <View style={{ flexDirection: 'row', backgroundColor: colors.bgSurface2, borderRadius: 14, padding: 4, gap: 4 }}>
          {TABS.map((t) => {
            const selected = tab === t.id
            const count = forms[t.id].marks.length
            return (
              <Pressable
                key={t.id}
                onPress={() => setTab(t.id)}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: selected ? colors.nebula1 : 'transparent' }}
              >
                <Text style={{ color: selected ? 'white' : colors.textPrimary, fontWeight: '800', fontSize: 15 }}>
                  {t.label}{count > 0 ? `  (${count})` : ''}
                </Text>
                <Text style={{ color: selected ? 'white' : colors.textMuted, fontSize: 12 }}>{t.hint}</Text>
              </Pressable>
            )
          })}
        </View>

        {showChanges && (
          <View style={{ backgroundColor: `${colors.warning}1f`, borderColor: colors.warning, borderWidth: 1, borderRadius: 12, padding: 12 }}>
            <Text style={{ color: colors.warning, fontWeight: '700', fontSize: 13 }}>Changes since PRE</Text>
            <Text style={{ color: colors.textPrimary, fontSize: 13 }}>
              {newDamage} new damage {newDamage === 1 ? 'mark' : 'marks'}, {toolIssues} {toolIssues === 1 ? 'tool' : 'tools'} missing or damaged.
            </Text>
          </View>
        )}

        {/* Vehicle info */}
        <Card>
          <Title>Vehicle information</Title>
          <View>
            {vehicle ? <InfoRow label="Car" value={`${vehicle.make ?? ''} ${vehicle.model ?? ''}`.trim()} /> : null}
            {vehicle?.plate_number ? <InfoRow label="Plate number" value={vehicle.plate_number} /> : null}
            {job?.profiles?.full_name ? <InfoRow label="Renter" value={job.profiles.full_name} /> : null}
            {job?.start_date ? <InfoRow label="Rental period" value={`${job.start_date} to ${job.end_date}`} /> : null}
            {!job ? <InfoRow label="Booking" value={String(bookingId)} /> : null}
          </View>
        </Card>

        {/* Tools and accessories */}
        <Card>
          <Title hint="Check each item as it is right now.">Tools and Accessories Checklist</Title>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.textMuted, fontSize: 13 }}>{checkedCount} of {TOOLS.length} checked</Text>
            <Pressable
              onPress={() => update({ tools: Object.fromEntries(TOOLS.map((t) => [t.id, 'present'])) })}
              style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.success }}
            >
              <Text style={{ color: colors.success, fontSize: 13, fontWeight: '700' }}>Mark all Present</Text>
            </Pressable>
          </View>
          {TOOLS.map((tool) => (
            <ToolRow key={tool.id} tool={tool} value={form.tools[tool.id]} onChange={(status) => setTool(tool.id, status)} />
          ))}
        </Card>

        {/* Vehicle diagram */}
        <Card>
          <Title hint="Tap a part of the car, then pick the damage code.">Vehicle Check List</Title>
          <Text style={{ color: colors.textMuted, fontSize: 12, textAlign: 'center' }}>Front</Text>
          <VehicleDiagram
            marks={form.marks}
            ghostMarks={tab === 'post_rental' ? forms.pre_rental.marks : []}
            onZonePress={setActiveZone}
          />
          <Text style={{ color: colors.textMuted, fontSize: 12, textAlign: 'center' }}>Rear</Text>
          {tab === 'post_rental' && forms.pre_rental.marks.length > 0 && (
            <Text style={{ color: colors.warning, fontSize: 12, textAlign: 'center' }}>Dashed circles are damage marked in the PRE tab.</Text>
          )}
        </Card>

        {/* Damage legend */}
        <Card>
          <Title>Damage Codes</Title>
          <LegendTable />
        </Card>

        {/* Odometer and fuel */}
        <Card>
          <Title>Odometer and Fuel</Title>
          <Field label="Odometer reading (km)" value={form.odometer} onChangeText={(v) => update({ odometer: v })} keyboardType="number-pad" placeholder="e.g. 24310" />
          <View style={{ gap: 6 }}>
            <Text style={{ color: colors.textMuted, fontSize: 13 }}>Fuel level</Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {FUEL_LEVELS.map((lvl) => (
                <Pressable
                  key={lvl}
                  onPress={() => update({ fuel: lvl })}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: colors.border,
                    backgroundColor: form.fuel === lvl ? colors.nebula3 : colors.bgSurface2,
                  }}
                >
                  <Text style={{ color: form.fuel === lvl ? 'white' : colors.textPrimary, fontSize: 13, fontWeight: '600' }}>{lvl}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Card>

        {/* Notes and fee */}
        <Card>
          <Title>Notes</Title>
          <Field
            label="Damage notes (optional)"
            value={form.notes}
            onChangeText={(v) => update({ notes: v })}
            multiline
            placeholder="e.g. small scratch on rear bumper"
            style={{ minHeight: 90, textAlignVertical: 'top' }}
          />
          <Field label="Damage fee (optional)" value={form.fee} onChangeText={(v) => update({ fee: v })} keyboardType="decimal-pad" placeholder="e.g. 1500" />
        </Card>

        {/* Confirmation */}
        <Card>
          <Title hint="Both sides confirm the vehicle condition above.">Confirmation</Title>
          <SignatureBox
            title="Renter / Lessee"
            name={form.renterName}
            onName={(v) => update({ renterName: v })}
            signed={form.renterSigned}
            onToggle={() => update({ renterSigned: !form.renterSigned })}
          />
          <View style={{ height: 1, backgroundColor: colors.border }} />
          <SignatureBox
            title="Owner / Rent-a-car Representative"
            name={form.staffName}
            onName={(v) => update({ staffName: v })}
            signed={form.staffSigned}
            onToggle={() => update({ staffSigned: !form.staffSigned })}
          />
        </Card>

        {/* Actions */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable
            onPress={clearAll}
            disabled={busy}
            style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgSurface2 }}
          >
            <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>Clear</Text>
          </Pressable>
          <Pressable
            onPress={submit}
            disabled={busy}
            style={{ flex: 2, backgroundColor: colors.nebula1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', opacity: busy ? 0.6 : 1 }}
          >
            {busy ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: '700' }}>Save {tabLabel} Inspection</Text>}
          </Pressable>
        </View>
      </ScrollView>

      <DamageSheet
        zoneId={activeZone}
        marks={form.marks}
        onToggle={toggleMark}
        onClearZone={clearZone}
        onClose={() => setActiveZone(null)}
      />
    </KeyboardAvoidingView>
  )
}
