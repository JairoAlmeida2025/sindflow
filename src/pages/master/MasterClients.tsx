type Client = { id: string; name: string; email: string; plan: string; status: "Ativo" | "Suspenso" | "Bloqueado"; whatsappConnected: boolean };

const mock: Client[] = [
  { id: "1", name: "Síndico 1", email: "s1@example.com", plan: "Mensal", status: "Ativo", whatsappConnected: true }
];

export default function MasterClients() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Gestão de Clientes</h1>
      <table style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>Nome</th><th>E-mail</th><th>Plano</th><th>Status</th><th>WhatsApp</th><th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {mock.map(c => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.email}</td>
              <td>{c.plan}</td>
              <td>{c.status}</td>
              <td>{c.whatsappConnected ? "Sim" : "Não"}</td>
              <td>
                <button>Suspender</button>
                <button>Bloquear</button>
                <button>Reativar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
