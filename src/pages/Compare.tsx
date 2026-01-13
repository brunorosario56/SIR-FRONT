import { useEffect, useState } from "react";
import { getMyColegas, getUserSchedule } from "../api/endpoints";
import { useAuth } from "../auth/AuthContext";
import type { Schedule, User } from "../api/types";
import { Button, Card } from "../components/ui";
import { Page } from "../components/Page";

const days = ["", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 8h-22h

export default function Compare() {
  const { user } = useAuth();
  const [colegas, setColegas] = useState<User[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [schedules, setSchedules] = useState<Map<string, Schedule>>(new Map());
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getMyColegas();
        setColegas(data.colegas || []);
      } catch (e: any) {
        setErr(e?.response?.data?.message || "Erro ao obter colegas.");
      }
    })();
  }, []);

  function toggleColega(id: string) {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function loadSchedules() {
    if (selectedIds.length === 0) return;
    
    setLoading(true);
    setErr(null);
    try {
      const promises = selectedIds.map(id => getUserSchedule(id));
      const results = await Promise.all(promises);
      
      const map = new Map<string, Schedule>();
      selectedIds.forEach((id, idx) => {
        map.set(id, results[idx]);
      });
      
      setSchedules(map);
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Erro ao obter horários.");
    } finally {
      setLoading(false);
    }
  }

  function isOccupied(userId: string, dia: number, hora: number): boolean {
    const schedule = schedules.get(userId);
    if (!schedule) return false;

    // Check if this hour falls within any block
    return schedule.blocos.some(bloco => {
      if (bloco.diaSemana !== dia) return false;
      
      const [bh, bm] = bloco.horaInicio.split(':').map(Number);
      const [eh, em] = bloco.horaFim.split(':').map(Number);
      const blocoInicio = bh * 60 + bm;
      const blocoFim = eh * 60 + em;
      
      // Check if the hour overlaps with the block
      const horaInicio = hora * 60;

      // Block occupies this hour if it starts before or during this hour AND ends after this hour starts
      return blocoInicio <= horaInicio && blocoFim > horaInicio;
    });
  }

  function getBlockInfo(userId: string, dia: number, hora: number): string | null {
    const schedule = schedules.get(userId);
    if (!schedule) return null;

    const bloco = schedule.blocos.find(b => {
      if (b.diaSemana !== dia) return false;
      
      const [bh, bm] = b.horaInicio.split(':').map(Number);
      const [eh, em] = b.horaFim.split(':').map(Number);
      const blocoInicio = bh * 60 + bm;
      const blocoFim = eh * 60 + em;
      
      const horaInicio = hora * 60;

      return blocoInicio <= horaInicio && blocoFim > horaInicio;
    });

    return bloco ? `${bloco.disciplina}${bloco.sala ? ` (${bloco.sala})` : ''}` : null;
  }

  function isFreeForAll(dia: number, hora: number): boolean {
    if (selectedIds.length === 0) return false;
    return selectedIds.every(id => !isOccupied(id, dia, hora));
  }

  const selectedUsers = colegas.filter(c => selectedIds.includes(c._id));

  return (
    <Page title="Comparar Horários">
      <div className="space-y-4">
        {err && <div className="text-sm text-red-300 bg-red-950/30 border border-red-500/30 rounded-lg p-3">{err}</div>}

      <Card>
        <div className="text-sm text-white/60 mb-3">Seleciona colegas para comparar</div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
          {user && (
            <button
              onClick={() => toggleColega(user._id)}
              className={`rounded-lg border p-3 text-left transition ${
                selectedIds.includes(user._id)
                  ? "bg-white text-black border-white"
                  : "border-white/10 hover:bg-white/10"
              }`}
            >
              <div className="font-medium truncate">{user.nome}</div>
              <div className="text-xs opacity-70 truncate">(Tu)</div>
            </button>
          )}
          {colegas.map((c) => (
            <button
              key={c._id}
              onClick={() => toggleColega(c._id)}
              className={`rounded-lg border p-3 text-left transition ${
                selectedIds.includes(c._id)
                  ? "bg-white text-black border-white"
                  : "border-white/10 hover:bg-white/10"
              }`}
            >
              <div className="font-medium truncate">{c.nome}</div>
              <div className="text-xs opacity-70 truncate">{c.email}</div>
            </button>
          ))}
        </div>

        {colegas.length === 0 && (
          <div className="text-sm text-white/50">Ainda não tens colegas.</div>
        )}

        <div className="flex gap-2">
          <Button onClick={loadSchedules} disabled={selectedIds.length === 0 || loading}>
            {loading ? "A carregar..." : "Comparar"}
          </Button>
          {selectedIds.length > 0 && (
            <Button variant="ghost" onClick={() => { setSelectedIds([]); setSchedules(new Map()); }}>
              Limpar
            </Button>
          )}
        </div>
      </Card>

      {schedules.size > 0 && (
        <Card>
          <div className="text-sm text-white/60 mb-3">
            Comparação de {selectedUsers.length} {selectedUsers.length === 1 ? 'pessoa' : 'pessoas'}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="border border-white/10 p-2 bg-black/30 sticky left-0 z-10">Hora</th>
                  {[1, 2, 3, 4, 5, 6, 7].map(dia => (
                    <th key={dia} className="border border-white/10 p-2 bg-black/30">
                      {days[dia]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hours.map(hora => (
                  <tr key={hora}>
                    <td className="border border-white/10 p-2 bg-black/30 font-medium sticky left-0 z-10">
                      {hora}:00
                    </td>
                    {[1, 2, 3, 4, 5, 6, 7].map(dia => {
                      const free = isFreeForAll(dia, hora);
                      const occupied = selectedIds.filter(id => isOccupied(id, dia, hora));
                      
                      return (
                        <td 
                          key={dia} 
                          className={`border border-white/10 p-1 text-xs ${
                            free 
                              ? "bg-green-950/30 text-green-200" 
                              : occupied.length === selectedIds.length
                              ? "bg-red-950/30 text-red-200"
                              : "bg-yellow-950/30 text-yellow-200"
                          }`}
                          title={free ? "Todos livres" : `${occupied.length}/${selectedIds.length} ocupados`}
                        >
                          {free ? (
                            <div className="text-center font-medium">✓ Livre</div>
                          ) : (
                            <div className="space-y-1">
                              {selectedIds.map(id => {
                                const info = getBlockInfo(id, dia, hora);
                                const userName = selectedUsers.find(u => u._id === id)?.nome || 
                                               (user?._id === id ? user.nome : '');
                                if (!info) return null;
                                return (
                                  <div key={id} className="truncate" title={`${userName}: ${info}`}>
                                    <span className="font-medium">{userName.split(' ')[0]}:</span> {info}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex gap-4 text-xs text-white/60">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-950/30 border border-green-500/30 rounded"></div>
              Todos livres
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-950/30 border border-yellow-500/30 rounded"></div>
              Parcialmente ocupado
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-950/30 border border-red-500/30 rounded"></div>
              Todos ocupados
            </div>
          </div>
        </Card>
      )}
      </div>
    </Page>
  );
}