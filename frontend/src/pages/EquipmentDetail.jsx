import React, {useEffect, useState} from 'react'
import axios from 'axios'
import { Link, useParams } from 'react-router-dom'
import { apiUrl } from '../api'
import { formatDateInput, formatDisplayDate, todayDateInput } from '../date'

export default function EquipmentDetail(){
  const { id } = useParams()
  const [equipment, setEquipment] = useState(null)
  const [entries, setEntries] = useState([])
  const [form, setForm] = useState({title:'', notes:'', created_at: todayDateInput()})

  useEffect(()=>{fetch()}, [id])
  async function fetch(){
    const [er, mr] = await Promise.all([axios.get(apiUrl('/equipment')), axios.get(apiUrl(`/equipment/${id}/maintenance`))])
    setEquipment(er.data.find(e=>e.id===Number(id)))
    setEntries(mr.data)
  }
  async function add(e){
    e.preventDefault()
    await axios.post(apiUrl(`/equipment/${id}/maintenance`), form)
    setForm({title:'', notes:'', created_at: todayDateInput()})
    fetch()
  }
  const [editingEquipment, setEditingEquipment] = useState(false)
  const [equipmentForm, setEquipmentForm] = useState({name:'', serial:'', created_at:'', owner_id:''})
  const [people, setPeople] = useState([])
  const [editingEntryId, setEditingEntryId] = useState(null)
  const [editingEntryForm, setEditingEntryForm] = useState({title:'', notes:'', created_at:''})

  useEffect(()=>{axios.get(apiUrl('/people')).then(r=>setPeople(r.data))}, [])

  async function saveEquipment(e){
    e.preventDefault()
    await axios.put(apiUrl(`/equipment/${id}`), equipmentForm)
    setEditingEquipment(false)
    fetch()
  }

  async function deleteEquipment(){
    if(!confirm('Delete equipment and its maintenance entries?')) return
    await axios.delete(apiUrl(`/equipment/${id}`))
    window.location = '/equipment'
  }

  async function editEntry(entry){
    setEditingEntryId(entry.id)
    setEditingEntryForm({title: entry.title || '', notes: entry.notes || '', created_at: formatDateInput(entry.created_at)})
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
    setEditingEntryForm({title:'', notes:'', created_at:''})
    fetch()
  }
  function cancelEditingEntry(){
    setEditingEntryId(null)
    setEditingEntryForm({title:'', notes:'', created_at:''})
  }

  if(!equipment) return <div>Loading...</div>
  const owner = people.find(p => p.id === equipment.owner_id)

  return (
    <div className="stack">
      <section className="panel detail-header">
        <div className="detail-title-row">
          <div className="detail-title-block">
            <p className="page-kicker">Equipment record</p>
            <h2 className="detail-title">{equipment.name}</h2>
            <div className="badge-row">
              {owner ? <Link to={`/people/${owner.id}`} className="badge accent-badge">Owner: {owner.name}</Link> : <span className="badge">No owner assigned</span>}
              {equipment.serial ? <span className="badge">Serial: {equipment.serial}</span> : null}
              <span className="badge">Created: {formatDisplayDate(equipment.created_at)}</span>
              <span className="badge">{entries.length} maintenance entries</span>
            </div>
          </div>
        </div>

      {editingEquipment ? (
        <form onSubmit={saveEquipment} className="form-grid compact">
          <input className="input" placeholder="Name" value={equipmentForm.name} onChange={e=>setEquipmentForm({...equipmentForm, name:e.target.value})} />
          <input className="input" placeholder="Serial" value={equipmentForm.serial} onChange={e=>setEquipmentForm({...equipmentForm, serial:e.target.value})} />
          <input className="input" type="date" value={equipmentForm.created_at} onChange={e=>setEquipmentForm({...equipmentForm, created_at:e.target.value})} />
          <select className="select" value={equipmentForm.owner_id || ''} onChange={e=>setEquipmentForm({...equipmentForm, owner_id: e.target.value || null})}>
              <option value="">No owner</option>
              {people.map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          <div className="action-row">
            <button className="button button-primary">Save equipment</button>
            <button type="button" className="button button-secondary" onClick={()=>setEditingEquipment(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <div className="action-row">
          <button className="button button-secondary" onClick={()=>{setEquipmentForm({name:equipment.name, serial:equipment.serial, created_at: formatDateInput(equipment.created_at), owner_id:equipment.owner_id}); setEditingEquipment(true)}}>Edit equipment</button>
          <button className="button button-danger" onClick={deleteEquipment}>Delete equipment</button>
        </div>
      )}
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <h3 className="section-title">New maintenance entry</h3>
            <p className="muted">Capture service notes, repairs, or inspection details for this asset.</p>
          </div>
        </div>
        <form onSubmit={add} className="form-grid">
          <input className="input" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} placeholder="Entry title" />
          <input className="input" type="date" value={form.created_at} onChange={e=>setForm({...form, created_at:e.target.value})} />
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
            <p className="muted">Service records attached to this equipment item.</p>
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
                  <input className="input" type="date" value={editingEntryForm.created_at} onChange={e=>setEditingEntryForm({...editingEntryForm, created_at:e.target.value})} />
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
                    <p className="record-meta">{formatDisplayDate(m.created_at)}</p>
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
