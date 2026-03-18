from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Person(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(50))
    vehicles = db.relationship('Vehicle', backref='owner', lazy=True)
    equipment = db.relationship('Equipment', backref='owner', lazy=True)

class Vehicle(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    vin = db.Column(db.String(64))
    make = db.Column(db.String(64))
    model = db.Column(db.String(64))
    year = db.Column(db.String(10))
    mileage = db.Column(db.Integer)
    owner_id = db.Column(db.Integer, db.ForeignKey('person.id'), nullable=True)
    maintenance = db.relationship('Maintenance', backref='vehicle', lazy=True)
    projects = db.relationship('Project', backref='vehicle', lazy=True, cascade='all, delete-orphan')

class Equipment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    serial = db.Column(db.String(120))
    owner_id = db.Column(db.Integer, db.ForeignKey('person.id'), nullable=True)
    maintenance = db.relationship('Maintenance', backref='equipment', lazy=True)

class Maintenance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200))
    notes = db.Column(db.Text)
    mileage_snapshot = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicle.id'), nullable=True)
    equipment_id = db.Column(db.Integer, db.ForeignKey('equipment.id'), nullable=True)

class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    status = db.Column(db.String(50), default='planning')
    summary = db.Column(db.Text)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicle.id'), nullable=False)
    tasks = db.relationship('ProjectTask', backref='project', lazy=True, cascade='all, delete-orphan')
    parts = db.relationship('ProjectPart', backref='project', lazy=True, cascade='all, delete-orphan')

class ProjectTask(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    notes = db.Column(db.Text)
    is_done = db.Column(db.Boolean, default=False)
    is_milestone = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)

class ProjectPart(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    part_number = db.Column(db.String(120))
    quantity = db.Column(db.Integer, default=1)
    estimated_cost = db.Column(db.Float)
    actual_cost = db.Column(db.Float)
    status = db.Column(db.String(50), default='planned')
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    project_id = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
