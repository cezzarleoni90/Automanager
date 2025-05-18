import React from 'react';
import CalendarioComponent from '../components/Calendario';

const Calendario = () => {
    return (
        <div className="container-fluid">
            <div className="row mb-4">
                <div className="col">
                    <h1 className="h3 mb-0 text-gray-800">Calendario de Servicios</h1>
                    <p className="text-muted">Gestiona y visualiza los servicios programados</p>
                </div>
            </div>
            <CalendarioComponent />
        </div>
    );
};

export default Calendario; 