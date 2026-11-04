import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { userApi } from '../api'
import { BottomNav } from '../components/BottomNav'
import { EmptyState, MomAppBar } from '../components/ui'
import type { DoctorVisit } from '../types'
import { DOCTOR_VISIT_TYPE_LABELS } from '../types'
import { isScheduledVisit, visitNeedsUpdate } from '../lib/visitCheckInLogic'
import { appPath } from '../routes'

function VisitRow({ visit, action }: { visit: DoctorVisit; action?: { to: string; label: string } }) {
  return (
    <div className="app-card app-card--outlined" style={{ marginBottom: 8 }}>
      <strong>{DOCTOR_VISIT_TYPE_LABELS[visit.visit_type] ?? visit.visit_type}</strong>
      <p className="u-muted" style={{ margin: '4px 0', fontSize: '0.85rem' }}>
        {new Date(visit.visit_date).toLocaleString()}
        {visit.provider_name ? ` · ${visit.provider_name}` : ''}
      </p>
      {visit.next_appointment_at && (
        <p style={{ margin: 0, fontSize: '0.85rem' }}>
          Next: {new Date(visit.next_appointment_at).toLocaleString()}
        </p>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
        {action && (
          <Link to={action.to} className="gradient-btn app-btn--sm" style={{ textDecoration: 'none', width: 'auto' }}>
            {action.label}
          </Link>
        )}
        <Link
          to={appPath(`visits/${visit.id}/edit`)}
          className="app-btn app-btn--ghost app-btn--sm"
          style={{ display: 'inline-block' }}
        >
          Edit
        </Link>
      </div>
    </div>
  )
}

export function DoctorVisitsPage() {
  const navigate = useNavigate()
  const [visits, setVisits] = useState<DoctorVisit[]>([])
  const [loading, setLoading] = useState(true)
  const now = useMemo(() => new Date(), [])

  useEffect(() => {
    userApi
      .listDoctorVisits()
      .then(setVisits)
      .catch(() => setVisits([]))
      .finally(() => setLoading(false))
  }, [])

  const upcoming = visits
    .filter((v) => isScheduledVisit(v, now) || (v.next_appointment_at && new Date(v.next_appointment_at) > now))
    .sort((a, b) => {
      const aTime = isScheduledVisit(a, now)
        ? new Date(a.visit_date).getTime()
        : new Date(a.next_appointment_at!).getTime()
      const bTime = isScheduledVisit(b, now)
        ? new Date(b.visit_date).getTime()
        : new Date(b.next_appointment_at!).getTime()
      return aTime - bTime
    })

  const needsUpdate = visits.filter((v) => visitNeedsUpdate(v, now))
  const past = visits
    .filter((v) => !isScheduledVisit(v, now) && !visitNeedsUpdate(v, now))
    .sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime())

  return (
    <>
      <MomAppBar pageTitle="Doctor visits" onBack={() => navigate(appPath())} />
      <div className="user-app-content page-section">
        <p className="u-muted" style={{ marginTop: 0 }}>
          Schedule what is coming up, then give a short update after the visit.
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <Link
            to={appPath('visits/new?mode=schedule')}
            className="gradient-btn"
            style={{ display: 'inline-block', textDecoration: 'none', width: 'auto' }}
          >
            + Schedule visit
          </Link>
          <Link
            to={appPath('visits/new?mode=past')}
            className="app-btn app-btn--outline"
            style={{ display: 'inline-block', textDecoration: 'none' }}
          >
            Log past visit
          </Link>
        </div>

        {loading ? (
          <div className="u-center-page"><div className="u-spinner" /></div>
        ) : visits.length === 0 ? (
          <EmptyState
            icon="🩺"
            title="No visits yet"
            body="Schedule an upcoming appointment, or log one you already had."
          />
        ) : (
          <>
            {upcoming.length > 0 && (
              <section style={{ marginBottom: 20 }}>
                <h2 className="u-heading-sm" style={{ marginBottom: 8 }}>Upcoming</h2>
                {upcoming.map((visit) => (
                  <VisitRow
                    key={`up-${visit.id}`}
                    visit={visit}
                    action={
                      isScheduledVisit(visit, now)
                        ? undefined
                        : { to: appPath(`visits/${visit.id}/edit?mode=update`), label: 'Update' }
                    }
                  />
                ))}
              </section>
            )}

            {needsUpdate.length > 0 && (
              <section style={{ marginBottom: 20 }}>
                <h2 className="u-heading-sm" style={{ marginBottom: 8 }}>Needs an update</h2>
                {needsUpdate.map((visit) => (
                  <VisitRow
                    key={`need-${visit.id}`}
                    visit={visit}
                    action={{ to: appPath(`visits/${visit.id}/edit?mode=update`), label: 'Give update' }}
                  />
                ))}
              </section>
            )}

            {past.length > 0 && (
              <section>
                <h2 className="u-heading-sm" style={{ marginBottom: 8 }}>Past visits</h2>
                {past.map((visit) => (
                  <VisitRow key={`past-${visit.id}`} visit={visit} />
                ))}
              </section>
            )}
          </>
        )}
      </div>
      <BottomNav />
    </>
  )
}
