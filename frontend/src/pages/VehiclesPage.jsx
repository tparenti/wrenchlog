import React, {useEffect, useState} from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { apiUrl } from '../api'
import { formatDisplayDate, todayDateInput } from '../date'

export default function VehiclesPage(){
  const [vehicles, setVehicles] = useState([])
  const [people, setPeople] = useState([])
  const [form, setForm] = useState({year:'', make:'', model:'', mileage:'', created_at: todayDateInput(), owner_id:''})
  const [ownerFilter, setOwnerFilter] = useState('all')

  useEffect(()=>{fetch();}, [])
  async function fetch(){
    const [vr, pr] = await Promise.all([axios.get(apiUrl('/vehicles')), axios.get(apiUrl('/people'))])
    setVehicles(vr.data)
    setPeople(pr.data)
  }
  async function add(e){
    e.preventDefault()
    await axios.post(apiUrl('/vehicles'), form)
    setForm({year:'', make:'', model:'', mileage:'', created_at: todayDateInput(), owner_id:''})
    fetch()
  }

  const filteredVehicles = vehicles.filter(vehicle => {
    if (ownerFilter === 'all') return true
    if (ownerFilter === 'unassigned') return !vehicle.owner_id
    return String(vehicle.owner_id) === ownerFilter
  })

  return (
    <div className="stack">
      <div className="page-head">
        <div className="page-copy">
          <p className="page-kicker">Fleet</p>
          <h2 className="page-title">Vehicles</h2>
          <p className="page-subtitle">Add vehicles, assign owners, and open detailed maintenance history.</p>
        </div>
        <span className="badge">{vehicles.length} active vehicles</span>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3 className="section-title">Add a vehicle</h3>
            <p className="muted">Create a serviceable asset and optionally attach it to an owner.</p>
          </div>
        </div>
        <form onSubmit={add} className="form-grid compact">
          <input className="input" placeholder="Year" value={form.year} onChange={e=>setForm({...form, year:e.target.value})} />
          <input className="input" placeholder="Make" value={form.make} onChange={e=>setForm({...form, make:e.target.value})} />
          <input className="input" placeholder="Model" value={form.model} onChange={e=>setForm({...form, model:e.target.value})} />
          <input className="input" placeholder="Mileage" value={form.mileage} onChange={e=>setForm({...form, mileage:e.target.value})} />
          <input className="input" type="date" value={form.created_at} onChange={e=>setForm({...form, created_at:e.target.value})} />
          <select className="select" value={form.owner_id} onChange={e=>setForm({...form, owner_id: e.target.value || ''})}>
          <option value="">No owner</option>
          {people.map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
          <button className="button button-primary">Add vehicle</button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3 className="section-title">Filter by owner</h3>
            <p className="muted">Show all vehicles, unassigned vehicles, or only one owner's records.</p>
          </div>
        </div>
        <div className="action-row">
          <button
            type="button"
            className={ownerFilter === 'all' ? 'button button-primary' : 'button button-secondary'}
            onClick={() => setOwnerFilter('all')}
          >
            All vehicles
          </button>
          <button
            type="button"
            className={ownerFilter === 'unassigned' ? 'button button-primary' : 'button button-secondary'}
            onClick={() => setOwnerFilter('unassigned')}
          >
            Unassigned
          </button>
          {people.map(person => (
            <button
              key={person.id}
              type="button"
              className={ownerFilter === String(person.id) ? 'button button-primary' : 'button button-secondary'}
              onClick={() => setOwnerFilter(String(person.id))}
            >
              {person.name}
            </button>
          ))}
        </div>
      </section>

      {filteredVehicles.length ? (
        <section className="record-grid">
          {filteredVehicles.map(v=> {
            const owner = people.find(p=>p.id===v.owner_id)
            return (
              <article key={v.id} className="record-card">
                <div className="record-header">
                  <div>
                    <h3 className="record-title"><Link to={`/vehicles/${v.id}`}>{v.year} {v.make} {v.model}</Link></h3>
                    <p className="record-meta">{owner ? `Owner: ${owner.name}` : 'No owner assigned'} • Created {formatDisplayDate(v.created_at)}</p>
                  </div>
                  <span className="badge">Vehicle #{v.id}</span>
                </div>
                <div className="meta-row">
                  {v.mileage != null && v.mileage !== '' ? <span className="badge accent-badge">Mileage: {Number(v.mileage).toLocaleString()}</span> : null}
                </div>
                <div className="action-row">
                  <Link to={`/vehicles/${v.id}`} className="button button-secondary">Open record</Link>
                </div>
              </article>
            )
          })}
        </section>
      ) : (
        <div className="empty-state">
          <h3 className="section-title">No matching vehicles</h3>
          <p className="muted">
            {vehicles.length
              ? 'No vehicles match the selected owner filter.'
              : 'Add your first vehicle to start tracking maintenance history.'}
          </p>
        </div>
      )}
    </div>
  )
}
