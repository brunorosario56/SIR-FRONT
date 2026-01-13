import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { 
  getMyColegas, 
  getFriendRequests, 
  respondFriendRequest, 
  sendFriendRequest, 
  removeColega,
  cancelFriendRequest 
} from "../api/endpoints";
import type { FriendRequest, User } from "../api/types";
import { Button, Card, Input, Label, Pill } from "../components/ui";
import type { AppOutletContext } from "../App";

export default function ColegasPage() {
  const { presence } = useOutletContext<AppOutletContext>();
  const [colegas, setColegas] = useState<User[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [email, setEmail] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setErr(null);
    try {
      const data = await getMyColegas();
      setColegas(data.colegas || []);
      const reqs = await getFriendRequests();
      setIncoming(reqs.incoming || []);
      setOutgoing(reqs.outgoing || []);
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Erro ao obter colegas.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return [...colegas].sort((a, b) => a.nome.localeCompare(b.nome));
    
    return colegas
      .filter(c => 
        c.nome.toLowerCase().includes(term) || 
        c.email.toLowerCase().includes(term)
      )
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [colegas, searchTerm]);

  async function onAdd() {
    if (!email.trim()) return;
    setBusy(true);
    setErr(null);
    setSuccess(null);
    try {
      await sendFriendRequest(email.trim());
      setEmail("");
      setSuccess("Pedido enviado com sucesso!");
      await load();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Erro ao enviar pedido.");
    } finally {
      setBusy(false);
    }
  }

  async function onRespond(requestId: string, decision: "accept" | "reject") {
    setBusy(true);
    setErr(null);
    setSuccess(null);
    try {
      await respondFriendRequest(requestId, decision);
      setSuccess(decision === "accept" ? "Pedido aceite!" : "Pedido rejeitado.");
      await load();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Erro ao responder ao pedido.");
    } finally {
      setBusy(false);
    }
  }

  async function onCancel(requestId: string) {
    if (!confirm("Tens a certeza que queres cancelar este pedido?")) return;
    setBusy(true);
    setErr(null);
    setSuccess(null);
    try {
      await cancelFriendRequest(requestId);
      setSuccess("Pedido cancelado.");
      await load();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Erro ao cancelar pedido.");
    } finally {
      setBusy(false);
    }
  }

  async function onRemove(colegaId: string, colegaNome: string) {
    if (!confirm(`Tens a certeza que queres remover ${colegaNome} dos teus colegas?`)) return;
    setBusy(true);
    setErr(null);
    setSuccess(null);
    try {
      await removeColega(colegaId);
      setSuccess("Colega removido.");
      await load();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Erro ao remover colega.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold">Colegas</div>
        <div className="text-white/60 text-sm">Gestão de colegas e pedidos de amizade</div>
      </div>

      {err && <div className="text-sm text-red-300 bg-red-950/30 border border-red-500/30 rounded-lg p-3">{err}</div>}
      {success && <div className="text-sm text-green-300 bg-green-950/30 border border-green-500/30 rounded-lg p-3">{success}</div>}

      <Card className="space-y-3">
        <div className="text-sm text-white/60">Adicionar colega por email</div>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
          <div>
            <Label>Email</Label>
            <Input 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="colega@exemplo.com"
              onKeyDown={(e) => e.key === "Enter" && onAdd()}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={onAdd} disabled={busy}>
              {busy ? "A adicionar..." : "Adicionar"}
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card>
          <div className="text-sm text-yellow-300 font-medium mb-2">📨 Pedidos recebidos ({incoming.length})</div>
          <div className="space-y-2">
            {incoming.map((req) => (
              <div key={req._id} className="rounded-xl border border-yellow-400/30 bg-gradient-to-br from-yellow-600/10 to-orange-600/5 p-3 flex items-center justify-between gap-3 hover:border-yellow-400/50 transition-all">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-yellow-50">{req.from.nome}</div>
                  <div className="text-xs text-yellow-300/70 truncate">{req.from.email}</div>
                  <div className="text-[11px] text-yellow-300/50 mt-1">
                    {new Date(req.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button variant="ghost" onClick={() => onRespond(req._id, "reject")} disabled={busy}>
                    Rejeitar
                  </Button>
                  <Button onClick={() => onRespond(req._id, "accept")} disabled={busy}>
                    Aceitar
                  </Button>
                </div>
              </div>
            ))}
            {incoming.length === 0 && <div className="text-sm text-white/50">Sem pedidos pendentes.</div>}
          </div>
        </Card>

        <Card>
          <div className="text-sm text-blue-300 font-medium mb-2">📤 Pedidos enviados ({outgoing.length})</div>
          <div className="space-y-2">
            {outgoing.map((req) => (
              <div key={req._id} className="rounded-xl border border-blue-400/30 bg-gradient-to-br from-blue-600/10 to-cyan-600/5 p-3 flex items-center justify-between gap-3 hover:border-blue-400/50 transition-all">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-blue-50">{req.to.nome}</div>
                  <div className="text-xs text-blue-300/70 truncate">{req.to.email}</div>
                  <div className="text-[11px] text-blue-300/50 mt-1">
                    {new Date(req.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-2 items-center flex-shrink-0">
                  <Pill className="bg-blue-500/30 text-blue-200 border-blue-400/50">Pendente</Pill>
                  <Button variant="ghost" size="sm" onClick={() => onCancel(req._id)} disabled={busy}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ))}
            {outgoing.length === 0 && <div className="text-sm text-white/50">Ainda não enviaste pedidos.</div>}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-white/60">Colegas ({filtered.length}/{colegas.length})</div>
          <Input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar..."
            className="w-64"
          />
        </div>
        <div className="space-y-2">
          {filtered.map((c) => {
            const p = presence[c._id];
            const online = p?.online;
            return (
              <div key={c._id} className="rounded-xl border border-green-400/30 bg-gradient-to-br from-green-600/10 to-emerald-600/5 p-3 flex items-center justify-between gap-3 hover:border-green-400/50 transition-all">
                <div className="flex-1 min-w-0">
                  <div className="font-medium flex items-center gap-2">
                    <span className="truncate text-green-50">{c.nome}</span>
                    <Pill className={online ? "bg-green-500/30 text-green-200 border-green-400/50" : "bg-gray-500/30 text-gray-300 border-gray-400/50"}>
                      {online ? "🟢 Online" : "⚪ Offline"}
                    </Pill>
                  </div>
                  <div className="text-xs text-green-300/70 truncate">{c.email}</div>
                  {!online && p?.lastSeen && (
                    <div className="text-xs text-green-300/50">Visto: {new Date(p.lastSeen).toLocaleString()}</div>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onRemove(c._id, c.nome)} 
                  disabled={busy}
                  className="flex-shrink-0"
                >
                  Remover
                </Button>
              </div>
            );
          })}

          {filtered.length === 0 && searchTerm && <div className="text-sm text-white/50">Nenhum colega encontrado.</div>}
          {colegas.length === 0 && <div className="text-sm text-white/50">Ainda não tens colegas.</div>}
        </div>
      </Card>
    </div>
  );
}
