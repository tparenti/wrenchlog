import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiUrl } from '../api'

const STATUS_OPTIONS = ['planning', 'in progress', 'waiting on parts', 'on hold', 'complete']
const PART_STATUS_OPTIONS = ['planned', 'ordered', 'received', 'installed', 'returned']

export default function ProjectDetail(){
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [form, setForm] = useState({ title: '', status: 'planning', summary: '', notes: '' })
  const [taskForm, setTaskForm] = useState({ title: '', notes: '', is_milestone: false })
  const [partForm, setPartForm] = useState({ name: '', part_number: '', quantity: '1', estimated_cost: '', actual_cost: '', status: 'planned', notes: '' })
  const [editingPartId, setEditingPartId] = useState(null)
  const [editingPartForm, setEditingPartForm] = useState({ name: '', part_number: '', quantity: '1', estimated_cost: '', actual_cost: '', status: 'planned', notes: '' })

  useEffect(() => { fetchProject() }, [id])

  async function fetchProject(){
    const response = await axios.get(apiUrl(`/projects/${id}`))
    setProject(response.data)
    setForm({
      title: response.data.title || '',
      status: response.data.status || 'planning',
      summary: response.data.summary || '',
      notes: response.data.notes || '',
    })
  }

  async function saveProject(e){
    e.preventDefault()
    await axios.put(apiUrl(`/projects/${id}`), form)
    fetchProject()
  }

  async function addTask(e){
    e.preventDefault()
    await axios.post(apiUrl(`/projects/${id}/tasks`), taskForm)
    setTaskForm({ title: '', notes: '', is_milestone: false })
    fetchProject()
  }

  async function toggleTask(task){
    await axios.put(apiUrl(`/project-tasks/${task.id}`), { is_done: !task.is_done })
    fetchProject()
  }

  async function deleteTask(taskId){
    await axios.delete(apiUrl(`/project-tasks/${taskId}`))
    fetchProject()
  }

  async function addPart(e){
    e.preventDefault()
    await axios.post(apiUrl(`/projects/${id}/parts`), partForm)
    setPartForm({ name: '', part_number: '', quantity: '1', estimated_cost: '', actual_cost: '', status: 'planned', notes: '' })
    fetchProject()
  }

  function startEditingPart(part){
    setEditingPartId(part.id)
    setEditingPartForm({
      name: part.name || '',
      part_number: part.part_number || '',
      quantity: String(part.quantity ?? 1),
      estimated_cost: part.estimated_cost ?? '',
      actual_cost: part.actual_cost ?? '',
      status: part.status || 'planned',
      notes: part.notes || '',
    })
  }

  async function savePart(e){
    e.preventDefault()
    await axios.put(apiUrl(`/project-parts/${editingPartId}`), editingPartForm)
    setEditingPartId(null)
    setEditingPartForm({ name: '', part_number: '', quantity: '1', estimated_cost: '', actual_cost: '', status: 'planned', notes: '' })
    fetchProject()
  }

  function cancelEditingPart(){
    setEditingPartId(null)
    setEditingPartForm({ name: '', part_number: '', quantity: '1', estimated_cost: '', actual_cost: '', status: 'planned', notes: '' })
  }

  async function deletePart(partId){
    await axios.delete(apiUrl(`/project-parts/${partId}`))
    fetchProject()
  }

  async function deleteProject(){
    if(!confirm('Delete this project?')) return
    const vehicleId = project?.vehicle?.id
    await axios.delete(apiUrl(`/projects/${id}`))
    if (vehicleId) {
      navigate(`/vehicles/${vehicleId}`)
      return
    }
    navigate('/vehicles')
  }

  if(!project) return <div>Loading...</div>

  return (
    <div className="stack">
      <section className="panel detail-header">
        <div className="detail-title-row">
          <div className="detail-title-block">
            <p className="page-kicker">Vehicle project</p>
            <h2 className="detail-title">{project.title}</h2>
            <div className="badge-row">
              <span className="badge accent-badge">{project.status}</span>
              {project.vehicle ? <Link className="badge" to={`/vehicles/${project.vehicle.id}`}>{project.vehicle.year} {project.vehicle.make} {project.vehicle.model}</Link> : null}
            </div>
          </div>
          <div className="action-row">
            <button className="button button-danger" onClick={deleteProject}>Delete project</button>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <h3 className="section-title">Project tracker</h3>
            <p className="muted">Use this for bigger repair, restoration, or troubleshooting work that spans multiple steps.</p>
          </div>
        </div>
        <form onSubmit={saveProject} className="form-grid">
          <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Project title" />
          <select className="select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            {STATUS_OPTIONS.map(status => <option key={status} value={status}>{status}</option>)}
          </select>
          <textarea className="textarea" value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} placeholder="Short summary of the project goal" />
          <textarea className="textarea" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Detailed notes, parts plan, blockers, or progress log" />
          <div className="action-row">
            <button className="button button-primary">Save project</button>
            {project.vehicle ? <Link className="button button-secondary" to={`/vehicles/${project.vehicle.id}`}>Back to vehicle</Link> : null}
          </div>
        </form>
      </section>

      <section className="detail-grid">
        <article className="panel">
          <div className="section-head">
            <div>
              <h3 className="section-title">Checklist and milestones</h3>
              <p className="muted">Track steps, inspections, and milestones for the project.</p>
            </div>
            <span className="badge">{project.completed_task_count}/{project.task_count} done</span>
          </div>
          <form onSubmit={addTask} className="form-grid">
            <input className="input" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="Task or milestone title" />
            <textarea className="textarea" value={taskForm.notes} onChange={e => setTaskForm({ ...taskForm, notes: e.target.value })} placeholder="Optional notes" />
            <label className="badge" style={{ width: 'fit-content' }}>
              <input type="checkbox" checked={taskForm.is_milestone} onChange={e => setTaskForm({ ...taskForm, is_milestone: e.target.checked })} />
              Milestone
            </label>
            <div className="action-row">
              <button className="button button-primary">Add item</button>
            </div>
          </form>
          {project.tasks?.length ? (
            <div className="entry-list">
              {project.tasks.map(task => (
                <article key={task.id} className="entry-card">
                  <div className="record-header">
                    <div>
                      <h4 className="entry-title">{task.title}</h4>
                      <p className="record-meta">{task.is_milestone ? 'Milestone' : 'Checklist item'}</p>
                    </div>
                    <span className="badge accent-badge">{task.is_done ? 'done' : 'open'}</span>
                  </div>
                  <p className="entry-notes">{task.notes || 'No notes.'}</p>
                  <div className="action-row">
                    <button className="button button-secondary" onClick={() => toggleTask(task)}>{task.is_done ? 'Mark open' : 'Mark done'}</button>
                    <button className="button button-danger" onClick={() => deleteTask(task.id)}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p className="muted">No project tasks yet.</p>
            </div>
          )}
        </article>

        <article className="panel">
          <div className="section-head">
            <div>
              <h3 className="section-title">Parts and cost tracking</h3>
              <p className="muted">Track planned parts, what was ordered, and what the job actually cost.</p>
            </div>
            <div className="badge-row">
              <span className="badge">Estimated: ${Number(project.estimated_total || 0).toFixed(2)}</span>
              <span className="badge accent-badge">Actual: ${Number(project.actual_total || 0).toFixed(2)}</span>
            </div>
          </div>
          <form onSubmit={addPart} className="form-grid">
            <input className="input" value={partForm.name} onChange={e => setPartForm({ ...partForm, name: e.target.value })} placeholder="Part name" />
            <input className="input" value={partForm.part_number} onChange={e => setPartForm({ ...partForm, part_number: e.target.value })} placeholder="Part number" />
            <input className="input" value={partForm.quantity} onChange={e => setPartForm({ ...partForm, quantity: e.target.value })} placeholder="Quantity" />
            <input className="input" value={partForm.estimated_cost} onChange={e => setPartForm({ ...partForm, estimated_cost: e.target.value })} placeholder="Estimated cost" />
            <input className="input" value={partForm.actual_cost} onChange={e => setPartForm({ ...partForm, actual_cost: e.target.value })} placeholder="Actual cost" />
            <select className="select" value={partForm.status} onChange={e => setPartForm({ ...partForm, status: e.target.value })}>
              {PART_STATUS_OPTIONS.map(status => <option key={status} value={status}>{status}</option>)}
            </select>
            <textarea className="textarea" value={partForm.notes} onChange={e => setPartForm({ ...partForm, notes: e.target.value })} placeholder="Optional notes" />
            <div className="action-row">
              <button className="button button-primary">Add part</button>
            </div>
          </form>
          {project.parts?.length ? (
            <div className="entry-list">
              {project.parts.map(part => (
                <article key={part.id} className="entry-card">
                  {editingPartId === part.id ? (
                    <form onSubmit={savePart} className="entry-stack">
                      <input className="input" value={editingPartForm.name} onChange={e => setEditingPartForm({ ...editingPartForm, name: e.target.value })} />
                      <input className="input" value={editingPartForm.part_number} onChange={e => setEditingPartForm({ ...editingPartForm, part_number: e.target.value })} placeholder="Part number" />
                      <input className="input" value={editingPartForm.quantity} onChange={e => setEditingPartForm({ ...editingPartForm, quantity: e.target.value })} placeholder="Quantity" />
                      <input className="input" value={editingPartForm.estimated_cost} onChange={e => setEditingPartForm({ ...editingPartForm, estimated_cost: e.target.value })} placeholder="Estimated cost" />
                      <input className="input" value={editingPartForm.actual_cost} onChange={e => setEditingPartForm({ ...editingPartForm, actual_cost: e.target.value })} placeholder="Actual cost" />
                      <select className="select" value={editingPartForm.status} onChange={e => setEditingPartForm({ ...editingPartForm, status: e.target.value })}>
                        {PART_STATUS_OPTIONS.map(status => <option key={status} value={status}>{status}</option>)}
                      </select>
                      <textarea className="textarea" value={editingPartForm.notes} onChange={e => setEditingPartForm({ ...editingPartForm, notes: e.target.value })} placeholder="Notes" />
                      <div className="action-row">
                        <button className="button button-primary">Save part</button>
                        <button type="button" className="button button-secondary" onClick={cancelEditingPart}>Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="record-header">
                        <div>
                          <h4 className="entry-title">{part.name}</h4>
                          <p className="record-meta">{part.part_number || 'No part number'} • Qty {part.quantity}</p>
                        </div>
                        <span className="badge accent-badge">{part.status}</span>
                      </div>
                      <div className="meta-row">
                        <span className="badge">Estimated: ${Number(part.estimated_line_total || 0).toFixed(2)}</span>
                        <span className="badge accent-badge">Actual: ${Number(part.actual_line_total || 0).toFixed(2)}</span>
                      </div>
                      <p className="entry-notes">{part.notes || 'No notes.'}</p>
                      <div className="action-row">
                        <button className="button button-secondary" onClick={() => startEditingPart(part)}>Edit</button>
                        <button className="button button-danger" onClick={() => deletePart(part.id)}>Delete</button>
                      </div>
                    </>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p className="muted">No parts tracked yet.</p>
            </div>
          )}
        </article>
      </section>
    </div>
  )
}