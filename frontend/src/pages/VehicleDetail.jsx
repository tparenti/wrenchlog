import React, {useEffect, useState} from 'react'
import axios from 'axios'
import { Link, useParams } from 'react-router-dom'
import { apiUrl } from '../api'

export default function VehicleDetail(){
  const { id } = useParams()
  const [vehicle, setVehicle] = useState(null)
  const [entries, setEntries] = useState([])
  const [form, setForm] = useState({title:'', notes:''})
  const [editingVehicle, setEditingVehicle] = useState(false)
  const [vehicleForm, setVehicleForm] = useState({vin:'', make:'', model:'', year:'', owner_id:''})
  const [people, setPeople] = useState([])
  const [editingEntryId, setEditingEntryId] = useState(null)
  const [editingEntryForm, setEditingEntryForm] = useState({title:'', notes:''})

  useEffect(()=>{fetch()}, [id])
  async function fetch(){
    const [vr, mr] = await Promise.all([axios.get(apiUrl('/vehicles')), axios.get(apiUrl(`/vehicle/${id}/maintenance`))])
    setVehicle(vr.data.find(v=>v.id===Number(id)))
    setEntries(mr.data)
    const pr = await axios.get(apiUrl('/people'))
    setPeople(pr.data)
  }
  async function add(e){
    e.preventDefault()
    await axios.post(apiUrl(`/vehicle/${id}/maintenance`), form)
    setForm({title:'', notes:''})
    fetch()
  }
  async function saveVehicle(e){
    e.preventDefault()
    await axios.put(apiUrl(`/vehicles/${id}`), vehicleForm)
    setEditingVehicle(false)
    fetch()
  }
  async function deleteVehicle(){
    if(!confirm('Delete vehicle and its maintenance entries?')) return
    await axios.delete(apiUrl(`/vehicles/${id}`))
    window.location = '/vehicles'
  }

  async function editEntry(entry){
    setEditingEntryId(entry.id)
    setEditingEntryForm({title: entry.title || '', notes: entry.notes || ''})
  }

  async function deleteEntry(entryId){
    if(!confirm('Delete maintenance entry?')) return
    await axios.delete(apiUrl(`/maintenance/${entryId}`))
    fetch()
  }
  async function saveEditingEntry(e){
    e.preventDefault()
    if(!editingEntryId) return
    await axios.put(apiUrl(`/maintenance/${editingEntryId}`), editingEntryForm)
    setEditingEntryId(null)
    setEditingEntryForm({title:'', notes:''})
    fetch()
  }
  function cancelEditingEntry(){
    setEditingEntryId(null)
    setEditingEntryForm({title:'', notes:''})
  }
  if(!vehicle) return <div>Loading...</div>
  const owner = people.find(p => p.id === vehicle.owner_id)

  return (
    <div className="stack">
      <section className="panel detail-header">
        <div className="detail-title-row">
          <div className="detail-title-block">
            <p className="page-kicker">Vehicle record</p>
            <h2 className="detail-title">{vehicle.year} {vehicle.make} {vehicle.model}</h2>
            <div className="badge-row">
              {owner ? <Link to={`/people/${owner.id}`} className="badge accent-badge">Owner: {owner.name}</Link> : <span className="badge">No owner assigned</span>}
              {vehicle.vin ? <span className="badge">VIN: {vehicle.vin}</span> : null}
              <span className="badge">{entries.length} maintenance entries</span>
            </div>
          </div>
        </div>

      {editingVehicle ? (
        <form onSubmit={saveVehicle} className="form-grid compact">
          <input className="input" placeholder="VIN" value={vehicleForm.vin} onChange={e=>setVehicleForm({...vehicleForm, vin:e.target.value})} />
          <input className="input" placeholder="Make" value={vehicleForm.make} onChange={e=>setVehicleForm({...vehicleForm, make:e.target.value})} />
          <input className="input" placeholder="Model" value={vehicleForm.model} onChange={e=>setVehicleForm({...vehicleForm, model:e.target.value})} />
          <input className="input" placeholder="Year" value={vehicleForm.year} onChange={e=>setVehicleForm({...vehicleForm, year:e.target.value})} />
          <select className="select" value={vehicleForm.owner_id || ''} onChange={e=>setVehicleForm({...vehicleForm, owner_id: e.target.value || null})}>
              <option value="">No owner</option>
              {people.map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          <div className="action-row">
            <button className="button button-primary">Save vehicle</button>
            <button type="button" className="button button-secondary" onClick={()=>setEditingVehicle(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <div className="action-row">
          <button className="button button-secondary" onClick={()=>{setVehicleForm({vin:vehicle.vin, make:vehicle.make, model:vehicle.model, year:vehicle.year, owner_id:vehicle.owner_id}); setEditingVehicle(true)}}>Edit vehicle</button>
          <button className="button button-danger" onClick={deleteVehicle}>Delete vehicle</button>
        </div>
      )}
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <h3 className="section-title">New maintenance entry</h3>
            <p className="muted">Record work performed, diagnosis details, or follow-up notes.</p>
          </div>
        </div>
        <form onSubmit={add} className="form-grid">
          <input className="input" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} placeholder="Entry title" />
          <textarea className="textarea" value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})} placeholder="Notes"></textarea>
          <div className="action-row">
            <button className="button button-primary">Add entry</button>
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <h3 className="section-title">Maintenance history</h3>
            <p className="muted">Each entry stays attached to this vehicle record.</p>
          </div>
        </div>
        {entries.length ? (
          <div className="entry-list">
            {entries.map(m=> (
              <article key={m.id} className="entry-card">
            {editingEntryId === m.id ? (
              <form onSubmit={saveEditingEntry}>
                <div className="entry-stack">
                  <input className="input" value={editingEntryForm.title} onChange={e=>setEditingEntryForm({...editingEntryForm, title:e.target.value})} />
                  <textarea className="textarea" value={editingEntryForm.notes} onChange={e=>setEditingEntryForm({...editingEntryForm, notes:e.target.value})} />
                  <div className="action-row">
                    <button type="submit" className="button button-primary">Save</button>
                    <button type="button" className="button button-secondary" onClick={cancelEditingEntry}>Cancel</button>
                  </div>
                </div>
              </form>
            ) : (
              <>
                <div className="record-header">
                  <div>
                    <h4 className="entry-title">{m.title}</h4>
                    <p className="record-meta">{new Date(m.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <p className="entry-notes">{m.notes || 'No notes recorded.'}</p>
                <div className="action-row">
                  <button className="button button-secondary" onClick={()=>editEntry(m)}>Edit</button>
                  <button className="button button-danger" onClick={()=>deleteEntry(m.id)}>Delete</button>
                </div>
              </>
            )}
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p className="muted">No maintenance entries yet.</p>
          </div>
        )}
      </section>
    </div>
  )
}
