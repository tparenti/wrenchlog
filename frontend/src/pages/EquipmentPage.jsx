import React, {useEffect, useState} from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { apiUrl } from '../api'
import { formatDisplayDate, todayDateInput } from '../date'

export default function EquipmentPage(){
  const [equipment, setEquipment] = useState([])
  const [people, setPeople] = useState([])
  const [form, setForm] = useState({name:'', serial:'', created_at: todayDateInput(), owner_id:''})
  const [ownerFilter, setOwnerFilter] = useState('all')

  useEffect(()=>{fetch();}, [])
  async function fetch(){
    const [er, pr] = await Promise.all([axios.get(apiUrl('/equipment')), axios.get(apiUrl('/people'))])
    setEquipment(er.data)
    setPeople(pr.data)
  }
  async function add(e){
    e.preventDefault()
    await axios.post(apiUrl('/equipment'), form)
    setForm({name:'', serial:'', created_at: todayDateInput(), owner_id:''})
    fetch()
  }

  const filteredEquipment = equipment.filter(item => {
    if (ownerFilter === 'all') return true
    if (ownerFilter === 'unassigned') return !item.owner_id
    return String(item.owner_id) === ownerFilter
  })

  return (
    <div className="stack">
      <div className="page-head">
        <div className="page-copy">
          <p className="page-kicker">Assets</p>
          <h2 className="page-title">Equipment</h2>
          <p className="page-subtitle">Track non-vehicle machines, shop tools, and field equipment with the same workflow.</p>
        </div>
        <span className="badge">{equipment.length} tracked assets</span>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3 className="section-title">Add equipment</h3>
            <p className="muted">Register a machine or tool and tie it to an owner if needed.</p>
          </div>
        </div>
        <form onSubmit={add} className="form-grid compact">
          <input className="input" placeholder="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
          <input className="input" placeholder="Serial" value={form.serial} onChange={e=>setForm({...form, serial:e.target.value})} />
          <input className="input" type="date" value={form.created_at} onChange={e=>setForm({...form, created_at:e.target.value})} />
          <select className="select" value={form.owner_id} onChange={e=>setForm({...form, owner_id: e.target.value || ''})}>
          <option value="">No owner</option>
          {people.map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
          <button className="button button-primary">Add equipment</button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3 className="section-title">Filter by owner</h3>
            <p className="muted">Narrow the equipment list to one owner or show unassigned assets.</p>
          </div>
        </div>
        <div className="action-row">
          <button
            type="button"
            className={ownerFilter === 'all' ? 'button button-primary' : 'button button-secondary'}
            onClick={() => setOwnerFilter('all')}
          >
            All equipment
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

      {filteredEquipment.length ? (
        <section className="record-grid">
          {filteredEquipment.map(item=> {
            const owner = people.find(p=>p.id===item.owner_id)
            return (
              <article key={item.id} className="record-card">
                <div className="record-header">
                  <div>
                    <h3 className="record-title"><Link to={`/equipment/${item.id}`}>{item.name}</Link></h3>
                    <p className="record-meta">{owner ? `Owner: ${owner.name}` : 'No owner assigned'} • Created {formatDisplayDate(item.created_at)}</p>
                  </div>
                  <span className="badge">Asset #{item.id}</span>
                </div>
                <div className="meta-row">
                  {item.serial ? <span className="badge accent-badge">Serial: {item.serial}</span> : null}
                </div>
                <div className="action-row">
                  <Link to={`/equipment/${item.id}`} className="button button-secondary">Open record</Link>
                </div>
              </article>
            )
          })}
        </section>
      ) : (
        <div className="empty-state">
          <h3 className="section-title">No matching equipment</h3>
          <p className="muted">
            {equipment.length
              ? 'No equipment matches the selected owner filter.'
              : 'Add your first asset to start logging service notes and ownership.'}
          </p>
        </div>
      )}
    </div>
  )
}
