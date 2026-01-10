import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { getMyColegas, getFriendRequests, respondFriendRequest, sendFriendRequest } from "../api/endpoints";
import type { FriendRequest, User } from "../api/types";
import { Button, Card, Input, Label, Pill } from "../components/ui";
import type { AppOutletContext } from "../App";

export default function ColegasPage() {
  const { presence } = useOutletContext<AppOutletContext>();
  const [colegas, setColegas] = useState<User[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [email, setEmail] = useState("");
  const [err, setErr] = useState<string | null>(null);
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

  const sorted = useMemo(() => {
    return [...colegas].sort((a, b) => a.nome.localeCompare(b.nome));
  }, [colegas]);

  async function onAdd() {
    if (!email.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      await sendFriendRequest(email.trim());
      setEmail("");
      await load();
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Erro ao enviar pedido.");
    } finally {
      setBusy(false);
    }
  }

  async function onRespond(requestId: string, decision: "accept" | "reject") {
    setBusy(true);
    setErr(null);
    try {
      await respondFriendRequest(requestId, decision);
      await load();
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Erro ao responder ao pedido.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold">Colegas</div>
        <div className="text-white/60 text-sm">Lista + presença (Socket.IO)</div>
      </div>

      {err && <div className="text-sm text-red-300">{err}</div>}

      <Card className="space-y-3">
        <div className="text-sm text-white/60">Adicionar colega por email</div>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
          <div>
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="colega@exemplo.com" />
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
          <div className="text-sm text-white/60 mb-2">Pedidos recebidos ({incoming.length})</div>
          <div className="space-y-2">
            {incoming.map((req) => (
              <div key={req._id} className="rounded-xl border border-white/10 bg-black/30 p-3 flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{req.from.nome}</div>
                  <div className="text-xs text-white/60">{req.from.email}</div>
                  <div className="text-[11px] text-white/40 mt-1">
                    Pedido em {new Date(req.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-2">
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
          <div className="text-sm text-white/60 mb-2">Pedidos enviados ({outgoing.length})</div>
          <div className="space-y-2">
            {outgoing.map((req) => (
              <div key={req._id} className="rounded-xl border border-white/10 bg-black/30 p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{req.to.nome}</div>
                  <div className="text-xs text-white/60">{req.to.email}</div>
                  <div className="text-[11px] text-white/40 mt-1">
                    Enviado em {new Date(req.createdAt).toLocaleString()}
                  </div>
                </div>
                <Pill>
                  {req.status === "pending" ? "Pendente" : req.status === "accepted" ? "Aceite" : "Rejeitado"}
                </Pill>
              </div>
            ))}
            {outgoing.length === 0 && <div className="text-sm text-white/50">Ainda não enviaste pedidos.</div>}
          </div>
        </Card>
      </div>

      <Card>
        <div className="text-sm text-white/60 mb-3">Colegas ({sorted.length})</div>
        <div className="space-y-2">
          {sorted.map((c) => {
            const p = presence[c._id];
            const online = p?.online;
            return (
              <div key={c._id} className="rounded-xl border border-white/10 bg-black/30 p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {c.nome}
                    <Pill className={online ? "text-green-200" : "text-white/70"}>
                      {online ? "Online" : "Offline"}
                    </Pill>
                  </div>
                  <div className="text-xs text-white/60">{c.email}</div>
                  {!online && p?.lastSeen && (
                    <div className="text-xs text-white/40">lastSeen: {new Date(p.lastSeen).toLocaleString()}</div>
                  )}
                </div>
              </div>
            );
          })}

          {sorted.length === 0 && <div className="text-sm text-white/50">Ainda não tens colegas.</div>}
        </div>
      </Card>
    </div>
  );
}
