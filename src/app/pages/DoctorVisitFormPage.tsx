import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { userApi } from '../api'
import { GradientButton, MomAppBar } from '../components/ui'
import { DOCTOR_VISIT_TYPES, DOCTOR_VISIT_TYPE_LABELS } from '../types'
import { appPath } from '../routes'

export function DoctorVisitFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [visitType, setVisitType] = useState('prenatal_checkup')
  const [visitDate, setVisitDate] = useState(() => new Date().toISOString().slice(0, 16))
  const [providerName, setProviderName] = useState('')
  const [facilityName, setFacilityName] = useState('')
  const [nextAppointment, setNextAppointment] = useState('')
  const [nextNotes, setNextNotes] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    userApi
      .listDoctorVisits()
      .then((visits) => visits.find((v) => v.id === id))
      .then((visit) => {
        if (!visit) return
        setVisitType(visit.visit_type)
        setVisitDate(new Date(visit.visit_date).toISOString().slice(0, 16))
        setProviderName(visit.provider_name ?? '')
        setFacilityName(visit.facility_name ?? '')
        setNextAppointment(
          visit.next_appointment_at
            ? new Date(visit.next_appointment_at).toISOString().slice(0, 16)
            : '',
        )
        setNextNotes(visit.next_appointment_notes ?? '')
      })
      .catch(() => setError('Could not load visit'))
  }, [id])

  async function submit() {
    setSaving(true)
    setError('')
    try {
      const body = {
        visit_date: new Date(visitDate).toISOString(),
        visit_type: visitType,
        provider_name: providerName.trim() || undefined,
        facility_name: facilityName.trim() || undefined,
        clinical_notes: notes.trim() || undefined,
        next_appointment_at: nextAppointment ? new Date(nextAppointment).toISOString() : undefined,
        next_appointment_notes: nextNotes.trim() || undefined,
        medications: [],
        lab_results: [],
      }
      if (isEdit && id) await userApi.updateDoctorVisit(id, body)
      else await userApi.createDoctorVisit(body)
      navigate(appPath('visits'))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save visit')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="user-app-content--no-nav">
      <MomAppBar pageTitle={isEdit ? 'Edit visit' : 'Log visit'} onBack={() => navigate(appPath('visits'))} />
      <div style={{ padding: 16 }}>
        {error && <div className="u-alert u-alert--error">{error}</div>}

        <label className="app-label">Visit type</label>
        <select className="app-input" value={visitType} onChange={(e) => setVisitType(e.target.value)}>
          {DOCTOR_VISIT_TYPES.map((t) => (
            <option key={t} value={t}>{DOCTOR_VISIT_TYPE_LABELS[t] ?? t}</option>
          ))}
        </select>

        <label className="app-label" style={{ marginTop: 12 }}>Visit date & time</label>
        <input className="app-input" type="datetime-local" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />

        <label className="app-label" style={{ marginTop: 12 }}>Provider (optional)</label>
        <input className="app-input" value={providerName} onChange={(e) => setProviderName(e.target.value)} />

        <label className="app-label" style={{ marginTop: 12 }}>Facility (optional)</label>
        <input className="app-input" value={facilityName} onChange={(e) => setFacilityName(e.target.value)} />

        <label className="app-label" style={{ marginTop: 12 }}>Notes (optional)</label>
        <textarea className="app-input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />

        <label className="app-label" style={{ marginTop: 12 }}>Next appointment (optional)</label>
        <input className="app-input" type="datetime-local" value={nextAppointment} onChange={(e) => setNextAppointment(e.target.value)} />

        <label className="app-label" style={{ marginTop: 12 }}>Next appointment notes</label>
        <input className="app-input" value={nextNotes} onChange={(e) => setNextNotes(e.target.value)} />

        <div style={{ marginTop: 20 }}>
          <GradientButton onClick={submit} disabled={saving}>
            {saving ? 'Saving…' : 'Save visit'}
          </GradientButton>
        </div>
      </div>
    </div>
  )
}
