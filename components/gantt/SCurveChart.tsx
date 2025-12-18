'use client';

import { SCurveDataPoint } from '@/utils/planning/scurve';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SCurveChartProps {
  data: SCurveDataPoint[];
  height?: number;
}

export default function SCurveChart({ data, height = 300 }: SCurveChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-500">
          No hay datos suficientes para mostrar la Curva S. Agrega tareas con fechas planificadas.
        </p>
      </div>
    );
  }

  // Formatear fechas para mostrar solo día/mes
  const formattedData = data.map(point => ({
    ...point,
    dateFormatted: new Date(point.date).toLocaleDateString('es-CL', { 
      day: '2-digit', 
      month: '2-digit' 
    }),
  }));

  // Limitar a mostrar máximo 30 puntos para mejor legibilidad
  const displayData = formattedData.length > 30
    ? formattedData.filter((_, index) => index % Math.ceil(formattedData.length / 30) === 0)
    : formattedData;

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={displayData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="dateFormatted"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            domain={[0, 100]}
            label={{ value: '% Acumulado', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '4px',
              padding: '8px',
            }}
            formatter={(value: number | undefined) => value !== undefined ? `${value.toFixed(1)}%` : '0%'}
            labelFormatter={(label) => `Fecha: ${new Date(label).toLocaleDateString('es-CL')}`}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="planCum"
            stroke="#3b82f6"
            strokeWidth={2}
            name="Planificado"
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="realCum"
            stroke="#10b981"
            strokeWidth={2}
            name="Real"
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

