from flask import Flask, render_template, request, redirect, url_for, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from models import db, Person, Vehicle, Equipment, Maintenance
import os

app = Flask(__name__)
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'wrenchlog.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)
CORS(app)

with app.app_context():
    db.create_all()

@app.route('/')
def index():
    people = Person.query.all()
    vehicles = Vehicle.query.all()
    equipment = Equipment.query.all()
    return render_template('index.html', people=people, vehicles=vehicles, equipment=equipment)

# --- API endpoints for React frontend ---
def person_to_dict(p):
    return {"id": p.id, "name": p.name, "phone": p.phone}

def vehicle_to_dict(v):
    return {"id": v.id, "vin": v.vin, "make": v.make, "model": v.model, "year": v.year, "owner_id": v.owner_id}

def equipment_to_dict(e):
    return {"id": e.id, "name": e.name, "serial": e.serial, "owner_id": e.owner_id}

def maintenance_to_dict(m):
    return {"id": m.id, "title": m.title, "notes": m.notes, "created_at": m.created_at.isoformat(), "vehicle_id": m.vehicle_id, "equipment_id": m.equipment_id}


@app.route('/api/people', methods=['GET','POST'])
def api_people():
    if request.method == 'POST':
        data = request.get_json() or {}
        name = data.get('name')
        phone = data.get('phone')
        if not name:
            return jsonify({'error': 'name required'}), 400
        p = Person(name=name, phone=phone)
        db.session.add(p)
        db.session.commit()
        return jsonify(person_to_dict(p)), 201
    all_people = Person.query.all()
    return jsonify([person_to_dict(p) for p in all_people])


@app.route('/api/people/<int:person_id>', methods=['GET','PUT','DELETE'])
def api_person_detail(person_id):
    p = Person.query.get_or_404(person_id)
    if request.method == 'GET':
        data = person_to_dict(p)
        data['vehicles'] = [vehicle_to_dict(v) for v in p.vehicles]
        data['equipment'] = [equipment_to_dict(e) for e in p.equipment]
        return jsonify(data)
    if request.method == 'PUT':
        data = request.get_json() or {}
        p.name = data.get('name', p.name)
        p.phone = data.get('phone', p.phone)
        db.session.commit()
        return jsonify(person_to_dict(p))
    # DELETE
    # cascade delete maintenance? leave FK null or delete related assets first
    # For simplicity, delete person's vehicles and equipment and their maintenance
    for v in list(p.vehicles):
        Maintenance.query.filter_by(vehicle_id=v.id).delete()
        db.session.delete(v)
    for e in list(p.equipment):
        Maintenance.query.filter_by(equipment_id=e.id).delete()
        db.session.delete(e)
    db.session.delete(p)
    db.session.commit()
    return jsonify({'status': 'deleted'})


@app.route('/api/vehicles', methods=['GET','POST'])
def api_vehicles():
    if request.method == 'POST':
        data = request.get_json() or {}
        v = Vehicle(vin=data.get('vin'), make=data.get('make'), model=data.get('model'), year=data.get('year'), owner_id=data.get('owner_id'))
        db.session.add(v)
        db.session.commit()
        return jsonify(vehicle_to_dict(v)), 201
    all_v = Vehicle.query.all()
    return jsonify([vehicle_to_dict(v) for v in all_v])


@app.route('/api/vehicles/<int:vehicle_id>', methods=['GET','PUT','DELETE'])
def api_vehicle_detail(vehicle_id):
    v = Vehicle.query.get_or_404(vehicle_id)
    if request.method == 'GET':
        return jsonify(vehicle_to_dict(v))
    if request.method == 'PUT':
        data = request.get_json() or {}
        v.vin = data.get('vin', v.vin)
        v.make = data.get('make', v.make)
        v.model = data.get('model', v.model)
        v.year = data.get('year', v.year)
        v.owner_id = data.get('owner_id', v.owner_id)
        db.session.commit()
        return jsonify(vehicle_to_dict(v))
    # DELETE
    Maintenance.query.filter_by(vehicle_id=v.id).delete()
    db.session.delete(v)
    db.session.commit()
    return jsonify({'status': 'deleted'})


@app.route('/api/equipment', methods=['GET','POST'])
def api_equipment():
    if request.method == 'POST':
        data = request.get_json() or {}
        e = Equipment(name=data.get('name'), serial=data.get('serial'), owner_id=data.get('owner_id'))
        db.session.add(e)
        db.session.commit()
        return jsonify(equipment_to_dict(e)), 201
    all_e = Equipment.query.all()
    return jsonify([equipment_to_dict(e) for e in all_e])


@app.route('/api/equipment/<int:equipment_id>', methods=['GET','PUT','DELETE'])
def api_equipment_detail(equipment_id):
    e = Equipment.query.get_or_404(equipment_id)
    if request.method == 'GET':
        return jsonify(equipment_to_dict(e))
    if request.method == 'PUT':
        data = request.get_json() or {}
        e.name = data.get('name', e.name)
        e.serial = data.get('serial', e.serial)
        e.owner_id = data.get('owner_id', e.owner_id)
        db.session.commit()
        return jsonify(equipment_to_dict(e))
    # DELETE
    Maintenance.query.filter_by(equipment_id=e.id).delete()
    db.session.delete(e)
    db.session.commit()
    return jsonify({'status': 'deleted'})


@app.route('/api/vehicle/<int:vehicle_id>/maintenance', methods=['GET','POST'])
def api_vehicle_maintenance(vehicle_id):
    if request.method == 'POST':
        data = request.get_json() or {}
        m = Maintenance(title=data.get('title'), notes=data.get('notes'), vehicle_id=vehicle_id)
        db.session.add(m)
        db.session.commit()
        return jsonify(maintenance_to_dict(m)), 201
    entries = Maintenance.query.filter_by(vehicle_id=vehicle_id).order_by(Maintenance.created_at.desc()).all()
    return jsonify([maintenance_to_dict(m) for m in entries])


@app.route('/api/equipment/<int:equipment_id>/maintenance', methods=['GET','POST'])
def api_equipment_maintenance(equipment_id):
    if request.method == 'POST':
        data = request.get_json() or {}
        m = Maintenance(title=data.get('title'), notes=data.get('notes'), equipment_id=equipment_id)
        db.session.add(m)
        db.session.commit()
        return jsonify(maintenance_to_dict(m)), 201
    entries = Maintenance.query.filter_by(equipment_id=equipment_id).order_by(Maintenance.created_at.desc()).all()
    return jsonify([maintenance_to_dict(m) for m in entries])


@app.route('/api/maintenance/<int:entry_id>', methods=['GET','PUT','DELETE'])
def api_maintenance_entry(entry_id):
    m = Maintenance.query.get_or_404(entry_id)
    if request.method == 'GET':
        return jsonify(maintenance_to_dict(m))
    if request.method == 'PUT':
        data = request.get_json() or {}
        m.title = data.get('title', m.title)
        m.notes = data.get('notes', m.notes)
        db.session.commit()
        return jsonify(maintenance_to_dict(m))
    # DELETE
    db.session.delete(m)
    db.session.commit()
    return jsonify({'status': 'deleted'})


# People
@app.route('/people', methods=['GET','POST'])
def people():
    if request.method == 'POST':
        name = request.form.get('name')
        phone = request.form.get('phone')
        if name:
            p = Person(name=name, phone=phone)
            db.session.add(p)
            db.session.commit()
        return redirect(url_for('people'))
    all_people = Person.query.all()
    return render_template('people.html', people=all_people)

# Vehicles
@app.route('/vehicles', methods=['GET','POST'])
def vehicles():
    if request.method == 'POST':
        vin = request.form.get('vin')
        make = request.form.get('make')
        model = request.form.get('model')
        year = request.form.get('year')
        owner_id = request.form.get('owner_id') or None
        v = Vehicle(vin=vin, make=make, model=model, year=year, owner_id=owner_id)
        db.session.add(v)
        db.session.commit()
        return redirect(url_for('vehicles'))
    all_vehicles = Vehicle.query.all()
    people = Person.query.all()
    return render_template('vehicles.html', vehicles=all_vehicles, people=people)

@app.route('/vehicle/<int:vehicle_id>/maintenance', methods=['GET','POST'])
def vehicle_maintenance(vehicle_id):
    v = Vehicle.query.get_or_404(vehicle_id)
    if request.method == 'POST':
        title = request.form.get('title')
        notes = request.form.get('notes')
        m = Maintenance(title=title, notes=notes, vehicle_id=vehicle_id)
        db.session.add(m)
        db.session.commit()
        return redirect(url_for('vehicle_maintenance', vehicle_id=vehicle_id))
    entries = Maintenance.query.filter_by(vehicle_id=vehicle_id).order_by(Maintenance.created_at.desc()).all()
    return render_template('maintenance.html', asset=v, entries=entries, asset_type='vehicle')

# Equipment
@app.route('/equipment', methods=['GET','POST'])
def equipment():
    if request.method == 'POST':
        name = request.form.get('name')
        serial = request.form.get('serial')
        owner_id = request.form.get('owner_id') or None
        e = Equipment(name=name, serial=serial, owner_id=owner_id)
        db.session.add(e)
        db.session.commit()
        return redirect(url_for('equipment'))
    all_eq = Equipment.query.all()
    people = Person.query.all()
    return render_template('equipment.html', equipment=all_eq, people=people)

@app.route('/equipment/<int:equipment_id>/maintenance', methods=['GET','POST'])
def equipment_maintenance(equipment_id):
    e = Equipment.query.get_or_404(equipment_id)
    if request.method == 'POST':
        title = request.form.get('title')
        notes = request.form.get('notes')
        m = Maintenance(title=title, notes=notes, equipment_id=equipment_id)
        db.session.add(m)
        db.session.commit()
        return redirect(url_for('equipment_maintenance', equipment_id=equipment_id))
    entries = Maintenance.query.filter_by(equipment_id=equipment_id).order_by(Maintenance.created_at.desc()).all()
    return render_template('maintenance.html', asset=e, entries=entries, asset_type='equipment')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
