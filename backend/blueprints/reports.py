from flask import Blueprint, jsonify, request, send_file
from backend.services.report_service import ReportService
from backend.utils.logger import log_activity
from backend.utils.security import require_roles, block_sql_injection, prevent_xss
from flask_jwt_extended import jwt_required, get_jwt_identity
from typing import Dict, Any
from datetime import datetime
from io import BytesIO

reports_bp = Blueprint('reports', __name__)
report_service = ReportService()

@reports_bp.route('/reports/inventory-value', methods=['GET'])
@jwt_required()
def get_inventory_value():
    """Obtiene reporte del valor del inventario"""
    try:
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')
        
        if fecha_inicio:
            fecha_inicio = datetime.fromisoformat(fecha_inicio)
        if fecha_fin:
            fecha_fin = datetime.fromisoformat(fecha_fin)
        
        resultado = report_service.get_inventory_value_report(fecha_inicio, fecha_fin)
        return jsonify(resultado)
        
    except ValueError as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400
    except Exception as e:
        log_activity('report_error', f"Error en reporte de valor: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Error interno del servidor'
        }), 500

@reports_bp.route('/reports/movements', methods=['GET'])
@jwt_required()
def get_movements():
    """Obtiene reporte de movimientos"""
    try:
        tipo = request.args.get('tipo')
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')
        
        if fecha_inicio:
            fecha_inicio = datetime.fromisoformat(fecha_inicio)
        if fecha_fin:
            fecha_fin = datetime.fromisoformat(fecha_fin)
        
        resultado = report_service.get_movements_report(tipo, fecha_inicio, fecha_fin)
        return jsonify(resultado)
        
    except ValueError as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400
    except Exception as e:
        log_activity('report_error', f"Error en reporte de movimientos: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Error interno del servidor'
        }), 500

@reports_bp.route('/reports/stock-alerts', methods=['GET'])
@jwt_required()
def get_stock_alerts():
    """Obtiene reporte de alertas de stock"""
    try:
        resultado = report_service.get_stock_alerts_report()
        return jsonify(resultado)
        
    except Exception as e:
        log_activity('report_error', f"Error en reporte de alertas: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Error interno del servidor'
        }), 500

@reports_bp.route('/reports/turnover', methods=['GET'])
@jwt_required()
def get_turnover():
    """Obtiene reporte de rotación de inventario"""
    try:
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')
        
        if fecha_inicio:
            fecha_inicio = datetime.fromisoformat(fecha_inicio)
        if fecha_fin:
            fecha_fin = datetime.fromisoformat(fecha_fin)
        
        resultado = report_service.get_turnover_report(fecha_inicio, fecha_fin)
        return jsonify(resultado)
        
    except ValueError as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400
    except Exception as e:
        log_activity('report_error', f"Error en reporte de rotación: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Error interno del servidor'
        }), 500

@reports_bp.route('/reports/export', methods=['POST'])
@jwt_required()
def export_report():
    """Exporta un reporte en el formato especificado"""
    try:
        data = request.get_json()
        report_type = data.get('type')
        format = data.get('format', 'csv')
        params = data.get('params', {})
        
        # Obtener el reporte según el tipo
        if report_type == 'inventory-value':
            resultado = report_service.get_inventory_value_report(
                datetime.fromisoformat(params.get('fecha_inicio')) if params.get('fecha_inicio') else None,
                datetime.fromisoformat(params.get('fecha_fin')) if params.get('fecha_fin') else None
            )
        elif report_type == 'movements':
            resultado = report_service.get_movements_report(
                params.get('tipo'),
                datetime.fromisoformat(params.get('fecha_inicio')) if params.get('fecha_inicio') else None,
                datetime.fromisoformat(params.get('fecha_fin')) if params.get('fecha_fin') else None
            )
        elif report_type == 'stock-alerts':
            resultado = report_service.get_stock_alerts_report()
        elif report_type == 'turnover':
            resultado = report_service.get_turnover_report(
                datetime.fromisoformat(params.get('fecha_inicio')) if params.get('fecha_inicio') else None,
                datetime.fromisoformat(params.get('fecha_fin')) if params.get('fecha_fin') else None
            )
        else:
            return jsonify({
                'status': 'error',
                'message': 'Tipo de reporte no válido'
            }), 400
        
        # Exportar el reporte
        file_data = report_service.export_report(resultado, format)
        
        # Crear archivo en memoria
        output = BytesIO(file_data)
        output.seek(0)
        
        # Enviar archivo
        return send_file(
            output,
            mimetype='text/csv' if format == 'csv' else 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=f'reporte_{report_type}_{datetime.now().strftime("%Y%m%d")}.{format}'
        )
        
    except ValueError as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 400
    except Exception as e:
        log_activity('report_error', f"Error exportando reporte: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Error interno del servidor'
        }), 500 