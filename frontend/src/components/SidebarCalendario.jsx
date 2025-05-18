import React from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const SidebarCalendario = ({ fechaSeleccionada, setFechaSeleccionada, mecanicos }) => {
  return (
    <aside className="w-80 min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-6 flex flex-col gap-8 border-r border-slate-700">
      <div>
        <h2 className="text-white text-lg font-bold mb-4">Calendario</h2>
        <Calendar
          onChange={setFechaSeleccionada}
          value={fechaSeleccionada}
          className="rounded-lg shadow-lg w-full"
          calendarType="ISO 8601"
          locale="es-ES"
        />
      </div>
      <div>
        <h2 className="text-white text-lg font-bold mb-4">Mecánicos</h2>
        <ul className="flex flex-col gap-3">
          {Array.isArray(mecanicos) && mecanicos.length > 0 ? (
            mecanicos.map(mecanico => (
              <li key={mecanico.id} className="flex items-center gap-3">
                <span
                  className="inline-block w-4 h-4 rounded-full border-2 border-white"
                  style={{ backgroundColor: mecanico.color || '#888' }}
                  title={mecanico.nombre}
                ></span>
                <span className="text-white text-base font-medium truncate">
                  {mecanico.nombre} {mecanico.apellido}
                </span>
              </li>
            ))
          ) : (
            <li className="text-slate-400">No hay mecánicos</li>
          )}
        </ul>
      </div>
    </aside>
  );
};

export default SidebarCalendario; 