type Usage = { user: string; total: number; provider: string; status: string };

const mock: Usage[] = [
  { user: "Síndico 1", total: 12, provider: "OpenAI", status: "OK" }
];

export default function MasterUsage() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Monitoramento de Uso</h1>
      <table style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>Usuário</th><th>Total requisições</th><th>Provedor</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          {mock.map(u => (
            <tr key={u.user}>
              <td>{u.user}</td>
              <td>{u.total}</td>
              <td>{u.provider}</td>
              <td>{u.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
