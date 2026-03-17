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
    owner_id = db.Column(db.Integer, db.ForeignKey('person.id'), nullable=True)
    maintenance = db.relationship('Maintenance', backref='vehicle', lazy=True)

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
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicle.id'), nullable=True)
    equipment_id = db.Column(db.Integer, db.ForeignKey('equipment.id'), nullable=True)
