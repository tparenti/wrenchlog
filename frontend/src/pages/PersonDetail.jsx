import React, {useEffect, useState} from 'react'
import axios from 'axios'
import { useParams, Link } from 'react-router-dom'
import { apiUrl } from '../api'

export default function PersonDetail(){
  const { id } = useParams()
  const [person, setPerson] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({name:'', phone:''})

  useEffect(()=>{fetch()}, [id])
  async function fetch(){
    const res = await axios.get(apiUrl(`/people/${id}`))
    setPerson(res.data)
    setForm({name: res.data.name || '', phone: res.data.phone || ''})
  }
  async function save(e){
    e.preventDefault()
    await axios.put(apiUrl(`/people/${id}`), form)
    setEditing(false)
    fetch()
  }
  async function removePerson(){
    if(!confirm('Delete person and their assets?')) return
    await axios.delete(apiUrl(`/people/${id}`))
    window.location = '/people'
  }
  async function deleteVehicle(vid){
    if(!confirm('Delete vehicle?')) return
    await axios.delete(apiUrl(`/vehicles/${vid}`))
    fetch()
  }
  async function deleteEquipment(eid){
    if(!confirm('Delete equipment?')) return
    await axios.delete(apiUrl(`/equipment/${eid}`))
    fetch()
  }

  if(!person) return <div>Loading...</div>
  return (
    <div className="stack">
      <section className="panel detail-header">
        <div className="detail-title-row">
          <div className="detail-title-block">
            <p className="page-kicker">Customer profile</p>
            <h2 className="detail-title">{person.name}</h2>
            <div className="badge-row">
              <span className="badge">{person.vehicles.length} vehicles</span>
              <span className="badge">{person.equipment.length} equipment items</span>
              <span className="badge accent-badge">Phone: {person.phone || 'Not set'}</span>
            </div>
          </div>
        </div>

      {editing ? (
        <form onSubmit={save} className="form-grid compact">
          <input className="input" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} placeholder="Full name" />
          <input className="input" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} placeholder="Phone number" />
          <div className="action-row">
            <button className="button button-primary">Save changes</button>
            <button type="button" className="button button-secondary" onClick={()=>setEditing(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <div className="action-row">
          <button className="button button-secondary" onClick={()=>setEditing(true)}>Edit person</button>
          <button className="button button-danger" onClick={removePerson}>Delete person</button>
        </div>
      )}
      </section>

      <section className="detail-grid">
        <article className="panel">
          <div className="section-head">
            <div>
              <h3 className="section-title">Vehicles</h3>
              <p className="muted">Assets currently assigned to this person.</p>
            </div>
          </div>
          {person.vehicles.length ? (
            <div className="entry-list">
              {person.vehicles.map(v=> (
                <div key={v.id} className="entry-card">
                  <div className="record-header">
                    <div>
                      <h4 className="entry-title"><Link className="link-accent" to={`/vehicles/${v.id}`}>{v.year} {v.make} {v.model}</Link></h4>
                    </div>
                  </div>
                  <div className="action-row">
                    <Link to={`/vehicles/${v.id}`} className="button button-secondary">Open</Link>
                    <button className="button button-danger" onClick={()=>deleteVehicle(v.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p className="muted">No vehicles assigned.</p>
            </div>
          )}
        </article>

        <article className="panel">
          <div className="section-head">
            <div>
              <h3 className="section-title">Equipment</h3>
              <p className="muted">Tracked tools and machines owned by this person.</p>
            </div>
          </div>
          {person.equipment.length ? (
            <div className="entry-list">
              {person.equipment.map(item=> (
                <div key={item.id} className="entry-card">
                  <div className="record-header">
                    <div>
                      <h4 className="entry-title"><Link className="link-accent" to={`/equipment/${item.id}`}>{item.name}</Link></h4>
                    </div>
                  </div>
                  <div className="action-row">
                    <Link to={`/equipment/${item.id}`} className="button button-secondary">Open</Link>
                    <button className="button button-danger" onClick={()=>deleteEquipment(item.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p className="muted">No equipment assigned.</p>
            </div>
          )}
        </article>
      </section>
    </div>
  )
}
