// Página de prueba simple para verificar que el servidor funciona
export default function TestPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>✅ Servidor Funcionando</h1>
      <p>Si ves esta página, el servidor está respondiendo correctamente.</p>
      <p>Timestamp: {new Date().toISOString()}</p>
    </div>
  );
}

