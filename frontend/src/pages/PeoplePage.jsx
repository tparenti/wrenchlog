import React, {useEffect, useState} from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { apiUrl } from '../api'

export default function PeoplePage(){
  const [people, setPeople] = useState([])
  const [name, setName] = useState('')

  useEffect(()=>{fetchPeople()}, [])
  async function fetchPeople(){
    const res = await axios.get(apiUrl('/people'))
    setPeople(res.data)
  }
  async function add(e){
    e.preventDefault()
    if(!name) return
    await axios.post(apiUrl('/people'), {name})
    setName('')
    fetchPeople()
  }
  return (
    <div className="stack">
      <div className="page-head">
        <div className="page-copy">
          <p className="page-kicker">Contacts</p>
          <h2 className="page-title">People</h2>
          <p className="page-subtitle">Keep customer records tied directly to their vehicles and equipment.</p>
        </div>
        <span className="badge">{people.length} records</span>
      </div>

      <section className="panel-grid">
        <article className="panel">
          <div className="panel-header">
            <div>
              <h3 className="section-title">Add a person</h3>
              <p className="muted">Create a contact before assigning assets.</p>
            </div>
          </div>
          <form onSubmit={add} className="form-grid">
            <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Full name" />
            <button className="button button-primary">Add person</button>
          </form>
        </article>

        <article className="panel">
          <div className="panel-header">
            <div>
              <h3 className="section-title">What you get</h3>
              <p className="muted">Each record becomes the hub for related assets.</p>
            </div>
          </div>
          <div className="badge-row">
            <span className="badge">Quick owner lookup</span>
            <span className="badge">Asset relationships</span>
            <span className="badge accent-badge">Profile editing</span>
          </div>
        </article>
      </section>

      {people.length ? (
        <section className="record-grid">
          {people.map(p=> (
            <article key={p.id} className="record-card">
              <div className="record-header">
                <div>
                  <h3 className="record-title"><Link to={`/people/${p.id}`}>{p.name}</Link></h3>
                  <p className="record-meta">{p.phone || 'No phone number saved'}</p>
                </div>
                <span className="badge">Customer #{p.id}</span>
              </div>
              <div className="action-row">
                <Link to={`/people/${p.id}`} className="button button-secondary">Open profile</Link>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <div className="empty-state">
          <h3 className="section-title">No people yet</h3>
          <p className="muted">Add your first customer record to start linking vehicles and equipment.</p>
        </div>
      )}
    </div>
  )
}
