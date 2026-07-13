import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { userApi } from '../api'
import { BottomNav } from '../components/BottomNav'
import { EmptyState, MomAppBar } from '../components/ui'
import type { DoctorVisit } from '../types'
import { DOCTOR_VISIT_TYPE_LABELS } from '../types'
import { appPath } from '../routes'

export function DoctorVisitsPage() {
  const navigate = useNavigate()
  const [visits, setVisits] = useState<DoctorVisit[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    userApi
      .listDoctorVisits()
      .then(setVisits)
      .catch(() => setVisits([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <MomAppBar pageTitle="Doctor visits" onBack={() => navigate(appPath())} />
      <div className="user-app-content page-section">
        <p className="u-muted" style={{ marginTop: 0 }}>
          Keep a simple record of check-ups, tests, and next appointments.
        </p>
        <Link to={appPath('visits/new')} className="gradient-btn" style={{ display: 'inline-block', marginBottom: 16, textDecoration: 'none', width: 'auto' }}>
          + Log visit
        </Link>

        {loading ? (
          <div className="u-center-page"><div className="u-spinner" /></div>
        ) : visits.length === 0 ? (
          <EmptyState icon="🩺" title="No visits yet" body="Log a recent or upcoming appointment to get gentle check-ins on Home." />
        ) : (
          visits.map((visit) => (
            <div key={visit.id} className="app-card app-card--outlined" style={{ marginBottom: 8 }}>
              <strong>{DOCTOR_VISIT_TYPE_LABELS[visit.visit_type] ?? visit.visit_type}</strong>
              <p className="u-muted" style={{ margin: '4px 0', fontSize: '0.85rem' }}>
                {new Date(visit.visit_date).toLocaleDateString()}
                {visit.provider_name ? ` · ${visit.provider_name}` : ''}
              </p>
              {visit.next_appointment_at && (
                <p style={{ margin: 0, fontSize: '0.85rem' }}>
                  Next: {new Date(visit.next_appointment_at).toLocaleString()}
                </p>
              )}
              <Link to={appPath(`visits/${visit.id}/edit`)} className="app-btn app-btn--ghost app-btn--sm" style={{ marginTop: 8, display: 'inline-block' }}>
                Edit
              </Link>
            </div>
          ))
        )}
      </div>
      <BottomNav />
    </>
  )
}
