from flask import Flask, Response, jsonify, request, send_from_directory
from flask_cors import CORS
from models import db, Person, Vehicle, Equipment, Maintenance, Project, ProjectPart, ProjectTask
import os
from sqlalchemy import text
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

basedir = os.path.abspath(os.path.dirname(__file__))
frontend_dist = os.path.join(basedir, 'frontend_dist')

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'wrenchlog.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)
CORS(app)


def parse_optional_int(value):
    if value in (None, ''):
        return None
    return int(value)


def parse_optional_float(value):
    if value in (None, ''):
        return None
    return float(value)


def ensure_vehicle_mileage_column():
    column_rows = db.session.execute(text('PRAGMA table_info(vehicle)')).mappings().all()
    column_names = {row['name'] for row in column_rows}
    if 'mileage' not in column_names:
        db.session.execute(text('ALTER TABLE vehicle ADD COLUMN mileage INTEGER'))
        db.session.commit()


def ensure_maintenance_mileage_snapshot_column():
    column_rows = db.session.execute(text('PRAGMA table_info(maintenance)')).mappings().all()
    column_names = {row['name'] for row in column_rows}
    if 'mileage_snapshot' not in column_names:
        db.session.execute(text('ALTER TABLE maintenance ADD COLUMN mileage_snapshot INTEGER'))
        db.session.commit()


def apply_vehicle_mileage_snapshot(vehicle, mileage_snapshot):
    if vehicle is None or mileage_snapshot is None:
        return
    vehicle.mileage = mileage_snapshot


def proxy_dev_frontend_request(path):
    frontend_origin = os.getenv('DEV_FRONTEND_ORIGIN', 'http://frontend:5173').rstrip('/')
    normalized_path = path or ''
    target = f'{frontend_origin}/{normalized_path}' if normalized_path else f'{frontend_origin}/'
    if request.query_string:
        target = f'{target}?{request.query_string.decode()}'

    proxy_headers = {}
    for header_name in ('Accept', 'User-Agent', 'Cache-Control'):
        header_value = request.headers.get(header_name)
        if header_value:
            proxy_headers[header_name] = header_value

    proxy_request = Request(target, headers=proxy_headers, method=request.method)

    try:
        upstream_response = urlopen(proxy_request, timeout=10)
    except HTTPError as exc:
        body = exc.read()
        response = Response(body, status=exc.code)
        content_type = exc.headers.get('Content-Type')
        if content_type:
            response.headers['Content-Type'] = content_type
        return response
    except URLError:
        return jsonify({'error': 'Development frontend is unavailable.'}), 503

    body = upstream_response.read()
    response = Response(body, status=upstream_response.status)
    excluded_headers = {'connection', 'content-length', 'transfer-encoding', 'content-encoding', 'keep-alive'}
    for header_name, header_value in upstream_response.headers.items():
        if header_name.lower() not in excluded_headers:
            response.headers[header_name] = header_value
    return response

with app.app_context():
    db.create_all()
    ensure_vehicle_mileage_column()
    ensure_maintenance_mileage_snapshot_column()

# --- API endpoints for React frontend ---
def person_to_dict(p):
    return {"id": p.id, "name": p.name, "phone": p.phone}

def vehicle_to_dict(v):
    return {"id": v.id, "vin": v.vin, "make": v.make, "model": v.model, "year": v.year, "mileage": v.mileage, "owner_id": v.owner_id}

def equipment_to_dict(e):
    return {"id": e.id, "name": e.name, "serial": e.serial, "owner_id": e.owner_id}

def maintenance_to_dict(m):
    return {"id": m.id, "title": m.title, "notes": m.notes, "mileage_snapshot": m.mileage_snapshot, "created_at": m.created_at.isoformat(), "vehicle_id": m.vehicle_id, "equipment_id": m.equipment_id}


def project_to_dict(project):
    estimated_total = sum((part.estimated_cost or 0) * (part.quantity or 1) for part in project.parts)
    actual_total = sum((part.actual_cost or 0) * (part.quantity or 1) for part in project.parts)
    return {
        "id": project.id,
        "title": project.title,
        "status": project.status,
        "summary": project.summary,
        "notes": project.notes,
        "task_count": len(project.tasks),
        "completed_task_count": sum(1 for task in project.tasks if task.is_done),
        "part_count": len(project.parts),
        "estimated_total": estimated_total,
        "actual_total": actual_total,
        "created_at": project.created_at.isoformat() if project.created_at else None,
        "updated_at": project.updated_at.isoformat() if project.updated_at else None,
        "vehicle_id": project.vehicle_id,
    }


def project_task_to_dict(task):
    return {
        "id": task.id,
        "title": task.title,
        "notes": task.notes,
        "is_done": task.is_done,
        "is_milestone": task.is_milestone,
        "created_at": task.created_at.isoformat() if task.created_at else None,
        "project_id": task.project_id,
    }


def project_part_to_dict(part):
    quantity = part.quantity or 1
    estimated_line_total = (part.estimated_cost or 0) * quantity
    actual_line_total = (part.actual_cost or 0) * quantity
    return {
        "id": part.id,
        "name": part.name,
        "part_number": part.part_number,
        "quantity": quantity,
        "estimated_cost": part.estimated_cost,
        "actual_cost": part.actual_cost,
        "estimated_line_total": estimated_line_total,
        "actual_line_total": actual_line_total,
        "status": part.status,
        "notes": part.notes,
        "created_at": part.created_at.isoformat() if part.created_at else None,
        "project_id": part.project_id,
    }


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
        v = Vehicle(
            vin=data.get('vin'),
            make=data.get('make'),
            model=data.get('model'),
            year=data.get('year'),
            mileage=parse_optional_int(data.get('mileage')),
            owner_id=data.get('owner_id')
        )
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
        v.mileage = parse_optional_int(data.get('mileage', v.mileage))
        v.owner_id = data.get('owner_id', v.owner_id)
        db.session.commit()
        return jsonify(vehicle_to_dict(v))
    # DELETE
    Maintenance.query.filter_by(vehicle_id=v.id).delete()
    db.session.delete(v)
    db.session.commit()
    return jsonify({'status': 'deleted'})


@app.route('/api/vehicle/<int:vehicle_id>/projects', methods=['GET', 'POST'])
def api_vehicle_projects(vehicle_id):
    vehicle = Vehicle.query.get_or_404(vehicle_id)
    if request.method == 'POST':
        data = request.get_json() or {}
        project = Project(
            title=data.get('title') or f'{vehicle.year or ""} {vehicle.make or ""} {vehicle.model or ""}'.strip() + ' project',
            status=data.get('status') or 'planning',
            summary=data.get('summary'),
            notes=data.get('notes'),
            vehicle_id=vehicle_id,
        )
        db.session.add(project)
        db.session.commit()
        return jsonify(project_to_dict(project)), 201
    projects = Project.query.filter_by(vehicle_id=vehicle_id).order_by(Project.updated_at.desc()).all()
    return jsonify([project_to_dict(project) for project in projects])


@app.route('/api/projects/<int:project_id>', methods=['GET', 'PUT', 'DELETE'])
def api_project_detail(project_id):
    project = Project.query.get_or_404(project_id)
    if request.method == 'GET':
        data = project_to_dict(project)
        data['vehicle'] = vehicle_to_dict(project.vehicle)
        data['tasks'] = [project_task_to_dict(task) for task in sorted(project.tasks, key=lambda item: item.created_at or project.created_at)]
        data['parts'] = [project_part_to_dict(part) for part in sorted(project.parts, key=lambda item: item.created_at or project.created_at)]
        return jsonify(data)
    if request.method == 'PUT':
        data = request.get_json() or {}
        project.title = data.get('title', project.title)
        project.status = data.get('status', project.status)
        project.summary = data.get('summary', project.summary)
        project.notes = data.get('notes', project.notes)
        db.session.commit()
        return jsonify(project_to_dict(project))
    db.session.delete(project)
    db.session.commit()
    return jsonify({'status': 'deleted'})


@app.route('/api/projects/<int:project_id>/tasks', methods=['GET', 'POST'])
def api_project_tasks(project_id):
    project = Project.query.get_or_404(project_id)
    if request.method == 'POST':
        data = request.get_json() or {}
        title = data.get('title')
        if not title:
            return jsonify({'error': 'title required'}), 400
        task = ProjectTask(
            title=title,
            notes=data.get('notes'),
            is_done=bool(data.get('is_done', False)),
            is_milestone=bool(data.get('is_milestone', False)),
            project_id=project.id,
        )
        db.session.add(task)
        db.session.commit()
        return jsonify(project_task_to_dict(task)), 201
    tasks = ProjectTask.query.filter_by(project_id=project.id).order_by(ProjectTask.created_at.asc()).all()
    return jsonify([project_task_to_dict(task) for task in tasks])


@app.route('/api/project-tasks/<int:task_id>', methods=['GET', 'PUT', 'DELETE'])
def api_project_task_detail(task_id):
    task = ProjectTask.query.get_or_404(task_id)
    if request.method == 'GET':
        return jsonify(project_task_to_dict(task))
    if request.method == 'PUT':
        data = request.get_json() or {}
        task.title = data.get('title', task.title)
        task.notes = data.get('notes', task.notes)
        if 'is_done' in data:
            task.is_done = bool(data.get('is_done'))
        if 'is_milestone' in data:
            task.is_milestone = bool(data.get('is_milestone'))
        db.session.commit()
        return jsonify(project_task_to_dict(task))
    db.session.delete(task)
    db.session.commit()
    return jsonify({'status': 'deleted'})


@app.route('/api/projects/<int:project_id>/parts', methods=['GET', 'POST'])
def api_project_parts(project_id):
    project = Project.query.get_or_404(project_id)
    if request.method == 'POST':
        data = request.get_json() or {}
        name = data.get('name')
        if not name:
            return jsonify({'error': 'name required'}), 400
        part = ProjectPart(
            name=name,
            part_number=data.get('part_number'),
            quantity=parse_optional_int(data.get('quantity')) or 1,
            estimated_cost=parse_optional_float(data.get('estimated_cost')),
            actual_cost=parse_optional_float(data.get('actual_cost')),
            status=data.get('status') or 'planned',
            notes=data.get('notes'),
            project_id=project.id,
        )
        db.session.add(part)
        db.session.commit()
        return jsonify(project_part_to_dict(part)), 201
    parts = ProjectPart.query.filter_by(project_id=project.id).order_by(ProjectPart.created_at.asc()).all()
    return jsonify([project_part_to_dict(part) for part in parts])


@app.route('/api/project-parts/<int:part_id>', methods=['GET', 'PUT', 'DELETE'])
def api_project_part_detail(part_id):
    part = ProjectPart.query.get_or_404(part_id)
    if request.method == 'GET':
        return jsonify(project_part_to_dict(part))
    if request.method == 'PUT':
        data = request.get_json() or {}
        part.name = data.get('name', part.name)
        part.part_number = data.get('part_number', part.part_number)
        if 'quantity' in data:
            part.quantity = parse_optional_int(data.get('quantity')) or 1
        if 'estimated_cost' in data:
            part.estimated_cost = parse_optional_float(data.get('estimated_cost'))
        if 'actual_cost' in data:
            part.actual_cost = parse_optional_float(data.get('actual_cost'))
        part.status = data.get('status', part.status)
        part.notes = data.get('notes', part.notes)
        db.session.commit()
        return jsonify(project_part_to_dict(part))
    db.session.delete(part)
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
    vehicle = Vehicle.query.get_or_404(vehicle_id)
    if request.method == 'POST':
        data = request.get_json() or {}
        mileage_snapshot = parse_optional_int(data.get('mileage_snapshot'))
        m = Maintenance(title=data.get('title'), notes=data.get('notes'), mileage_snapshot=mileage_snapshot, vehicle_id=vehicle_id)
        db.session.add(m)
        apply_vehicle_mileage_snapshot(vehicle, mileage_snapshot)
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
        m.mileage_snapshot = parse_optional_int(data.get('mileage_snapshot', m.mileage_snapshot))
        if m.vehicle is not None:
            apply_vehicle_mileage_snapshot(m.vehicle, m.mileage_snapshot)
        db.session.commit()
        return jsonify(maintenance_to_dict(m))
    # DELETE
    db.session.delete(m)
    db.session.commit()
    return jsonify({'status': 'deleted'})


@app.route('/', defaults={'path': ''}, methods=['GET', 'HEAD'])
@app.route('/<path:path>', methods=['GET', 'HEAD'])
def serve_frontend(path):
    requested_path = os.path.join(frontend_dist, path)

    if path and os.path.isfile(requested_path):
        return send_from_directory(frontend_dist, path)

    index_path = os.path.join(frontend_dist, 'index.html')
    if os.path.isfile(index_path):
        return send_from_directory(frontend_dist, 'index.html')

    if os.getenv('FLASK_ENV') == 'development':
        return proxy_dev_frontend_request(path)

    return jsonify({'error': 'Frontend assets are not available in this environment.'}), 503

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
