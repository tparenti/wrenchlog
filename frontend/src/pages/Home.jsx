import React from 'react'
import { Link } from 'react-router-dom'

export default function Home(){
  return (
    <>
      <section className="hero">
        <p className="eyebrow">Workshop overview</p>
        <h2 className="hero-title">Keep every owner, machine, and service record connected.</h2>
        <p className="hero-text">
          WrenchLog gives you a cleaner way to manage customers, vehicles, equipment, and maintenance history without digging through scattered notes.
        </p>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <p className="stat-label">People</p>
          <p className="stat-value">Owners</p>
          <p className="stat-note">Track contact details and the assets each person owns.</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Vehicles</p>
          <p className="stat-value">Fleet</p>
          <p className="stat-note">Store year, make, model, VIN, and maintenance history.</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Equipment</p>
          <p className="stat-value">Tools</p>
          <p className="stat-note">Track non-vehicle assets with ownership and service records.</p>
        </article>
      </section>

      <section className="split-callout">
        <article className="panel">
          <div className="panel-header">
            <div>
              <h3 className="section-title">Built for real shop workflows</h3>
              <p className="muted">Use one system for intake, ownership, and service history.</p>
            </div>
          </div>
          <div className="badge-row">
            <span className="badge">Owner relationships</span>
            <span className="badge accent-badge">Maintenance logs</span>
            <span className="badge">Editable records</span>
          </div>
        </article>

        <article className="panel quick-links">
          <Link to="/people" className="quick-link">
            <strong>Manage people</strong>
            <p>Open contact records and see assigned vehicles and equipment.</p>
          </Link>
          <Link to="/vehicles" className="quick-link">
            <strong>Open vehicles</strong>
            <p>Review assets and add service entries with notes.</p>
          </Link>
          <Link to="/equipment" className="quick-link">
            <strong>Open equipment</strong>
            <p>Track tools and machines the same way as the vehicle fleet.</p>
          </Link>
        </article>
      </section>
    </>
  )
}
