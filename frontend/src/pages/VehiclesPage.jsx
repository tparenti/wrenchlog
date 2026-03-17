import React, {useEffect, useState} from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'

const API = (path) => `http://localhost:5000/api${path}`

export default function VehiclesPage(){
  const [vehicles, setVehicles] = useState([])
  const [people, setPeople] = useState([])
  const [form, setForm] = useState({year:'', make:'', model:'', owner_id:''})

  useEffect(()=>{fetch();}, [])
  async function fetch(){
    const [vr, pr] = await Promise.all([axios.get(API('/vehicles')), axios.get(API('/people'))])
    setVehicles(vr.data)
    setPeople(pr.data)
  }
  async function add(e){
    e.preventDefault()
    await axios.post(API('/vehicles'), form)
    setForm({year:'', make:'', model:'', owner_id:''})
    fetch()
  }
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
          <select className="select" value={form.owner_id} onChange={e=>setForm({...form, owner_id: e.target.value || ''})}>
          <option value="">No owner</option>
          {people.map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
          <button className="button button-primary">Add vehicle</button>
        </form>
      </section>

      {vehicles.length ? (
        <section className="record-grid">
          {vehicles.map(v=> {
            const owner = people.find(p=>p.id===v.owner_id)
            return (
              <article key={v.id} className="record-card">
                <div className="record-header">
                  <div>
                    <h3 className="record-title"><Link to={`/vehicles/${v.id}`}>{v.year} {v.make} {v.model}</Link></h3>
                    <p className="record-meta">{owner ? `Owner: ${owner.name}` : 'No owner assigned'}</p>
                  </div>
                  <span className="badge">Vehicle #{v.id}</span>
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
          <h3 className="section-title">No vehicles yet</h3>
          <p className="muted">Add your first vehicle to start tracking maintenance history.</p>
        </div>
      )}
    </div>
  )
}
