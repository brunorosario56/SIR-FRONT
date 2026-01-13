import { useEffect, useMemo, useState } from "react";
import type { ScheduleBlock } from "../api/types";
import { getMySchedule, putMySchedule } from "../api/endpoints";
import { Button, Card, Input, Label, Select } from "../components/ui";

const days = ["", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function emptyBlock(): ScheduleBlock {
  return { disciplina: "", sala: "", diaSemana: 1, horaInicio: "09:00", horaFim: "10:00" };
}

export default function SchedulePage() {
  const [blocos, setBlocos] = useState<ScheduleBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [draft, setDraft] = useState<ScheduleBlock>(emptyBlock());

  useEffect(() => {
    (async () => {
      try {
        const data = await getMySchedule();
        setBlocos(data.blocos || []);
      } catch (e: any) {
        setErr(e?.response?.data?.message || "Erro ao carregar horário.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);


  // Generate 30-minute time slots from earliest to latest block
  const timeSlots = useMemo(() => {
    if (blocos.length === 0) return [];
    
    const times: string[] = [];
    blocos.forEach(b => {
      times.push(b.horaInicio, b.horaFim);
    });
    
    if (times.length === 0) return ["09:00", "18:00"];
    
    // Find min and max times
    const sorted = times.sort();
    const [startHour, startMin] = sorted[0].split(':').map(Number);
    const [endHour, endMin] = sorted[sorted.length - 1].split(':').map(Number);
    
    // Generate 30-min slots
    const slots: string[] = [];
    let currentHour = startHour;
    let currentMin = startMin;
    
    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      slots.push(`${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`);
      currentMin += 30;
      if (currentMin >= 60) {
        currentMin = 0;
        currentHour++;
      }
    }
    slots.push(`${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`);
    
    return slots;
  }, [blocos]);

  // Assign colors to disciplines
  const disciplineColors = useMemo(() => {
    const colors = [
      "from-blue-500/20 to-blue-600/20 border-blue-500/40",
      "from-purple-500/20 to-purple-600/20 border-purple-500/40",
      "from-green-500/20 to-green-600/20 border-green-500/40",
      "from-orange-500/20 to-orange-600/20 border-orange-500/40",
      "from-pink-500/20 to-pink-600/20 border-pink-500/40",
      "from-cyan-500/20 to-cyan-600/20 border-cyan-500/40",
      "from-yellow-500/20 to-yellow-600/20 border-yellow-500/40",
      "from-red-500/20 to-red-600/20 border-red-500/40",
    ];
    
    const map = new Map<string, string>();
    const uniqueDisciplines = Array.from(new Set(blocos.map(b => b.disciplina)));
    uniqueDisciplines.forEach((disc, idx) => {
      map.set(disc, colors[idx % colors.length]);
    });
    
    return map;
  }, [blocos]);

  function addBlock() {
    if (!draft.disciplina.trim()) {
      setErr("Disciplina é obrigatória.");
      return;
    }
    setErr(null);
    setBlocos((prev) => [...prev, { ...draft, disciplina: draft.disciplina.trim(), sala: draft.sala?.trim() }]);
    setDraft(emptyBlock());
  }

  function removeIdx(idx: number) {
    setBlocos((prev) => prev.filter((_, i) => i !== idx));
  }

  async function saveAll() {
    setSaving(true);
    setErr(null);
    try {
      await putMySchedule(blocos);
      // Show success message briefly
      const successMsg = document.createElement('div');
      successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      successMsg.textContent = 'Horário guardado!';
      document.body.appendChild(successMsg);
      setTimeout(() => successMsg.remove(), 2000);
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Erro ao guardar horário.");
    } finally {
      setSaving(false);
    }
  }

  function clearAll() {
    if (confirm('Apagar todos os blocos?')) {
      setBlocos([]);
    }
  }

  // Helper function to calculate slot span
  function calculateSlotSpan(startTime: string, endTime: string): number {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    return Math.max(1, Math.ceil(durationMinutes / 30));
  }

  // Helper function to find which slot index a time belongs to
  function findSlotIndex(time: string): number {
    return timeSlots.findIndex(slot => slot === time);
  }

  if (loading) return <div className="p-2">A carregar…</div>;

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold">Horário</div>
        <div className="text-white/60 text-sm">Adiciona blocos e guarda para a API</div>
      </div>

      {err && <div className="text-sm text-red-300">{err}</div>}

      <Card className="space-y-3">
        <div className="text-sm text-white/60">Adicionar bloco</div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2">
            <Label>Disciplina</Label>
            <Input value={draft.disciplina} onChange={(e) => setDraft((d) => ({ ...d, disciplina: e.target.value }))} />
          </div>

          <div>
            <Label>Sala</Label>
            <Input value={draft.sala || ""} onChange={(e) => setDraft((d) => ({ ...d, sala: e.target.value }))} />
          </div>

          <div>
            <Label>Dia da semana</Label>
            <Select
              value={draft.diaSemana}
              onChange={(e) => setDraft((d) => ({ ...d, diaSemana: Number(e.target.value) }))}
            >
              <option value={1}>Segunda</option>
              <option value={2}>Terça</option>
              <option value={3}>Quarta</option>
              <option value={4}>Quinta</option>
              <option value={5}>Sexta</option>
              <option value={6}>Sábado</option>
              <option value={7}>Domingo</option>
            </Select>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <Label>Início</Label>
              <Input value={draft.horaInicio} onChange={(e) => setDraft((d) => ({ ...d, horaInicio: e.target.value }))} placeholder="HH:MM" />
            </div>
            <div className="flex-1">
              <Label>Fim</Label>
              <Input value={draft.horaFim} onChange={(e) => setDraft((d) => ({ ...d, horaFim: e.target.value }))} placeholder="HH:MM" />
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button onClick={addBlock}>Adicionar</Button>
          <Button variant="ghost" onClick={saveAll} disabled={saving}>
            {saving ? "A guardar..." : "Guardar na API"}
          </Button>
          {blocos.length > 0 && (
            <Button variant="danger" onClick={clearAll}>
              Limpar tudo
            </Button>
          )}
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <div className="text-sm text-white/60">Horário Semanal</div>
        </div>

        {blocos.length === 0 ? (
          <div className="p-8 text-center text-sm text-white/50">
            Ainda não tens blocos no horário.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header with days */}
              <div className="grid grid-cols-8 border-b border-white/10">
                <div className="p-3 text-xs font-medium text-white/40 border-r border-white/10">Hora</div>
                {[1, 2, 3, 4, 5, 6, 7].map(day => (
                  <div key={day} className="p-3 text-center text-sm font-medium border-r border-white/10 last:border-r-0">
                    {days[day]}
                  </div>
                ))}
              </div>

              {/* Time slots rows */}
              {timeSlots.slice(0, -1).map((startTime, idx) => {
                return (
                  <div key={startTime} className="grid grid-cols-8 border-b border-white/10 last:border-b-0 h-[60px]">
                    {/* Time label */}
                    <div className="p-3 text-xs text-white/40 border-r border-white/10 flex items-start">
                      <div>{startTime}</div>
                    </div>

                    {/* Day columns */}
                    {[1, 2, 3, 4, 5, 6, 7].map(day => {
                      // Find blocks that START in this time slot for this day
                      const dayBlocks = blocos.filter(b => 
                        b.diaSemana === day && 
                        b.horaInicio === startTime
                      );

                      return (
                        <div key={day} className="border-r border-white/10 last:border-r-0 relative">
                          {dayBlocks.map((block, blockIdx) => {
                            const colorClass = disciplineColors.get(block.disciplina) || "from-gray-500/20 to-gray-600/20 border-gray-500/40";
                            const originalIdx = blocos.findIndex(b => b === block);
                            const spanSlots = calculateSlotSpan(block.horaInicio, block.horaFim);
                            
                            return (
                              <div
                                key={blockIdx}
                                className={`absolute left-0.5 right-0.5 top-0 rounded-lg border bg-gradient-to-br ${colorClass} p-2 group hover:scale-[1.02] transition-transform cursor-pointer overflow-hidden`}
                                style={{
                                  height: `${spanSlots * 60}px`,
                                  zIndex: 10
                                }}
                              >
                                <div className="text-xs font-semibold mb-1 line-clamp-2">{block.disciplina}</div>
                                <div className="text-[10px] text-white/60 space-y-0.5">
                                  <div>{block.horaInicio} - {block.horaFim}</div>
                                  {block.sala && <div>📍 {block.sala}</div>}
                                </div>
                                <button
                                  onClick={() => removeIdx(originalIdx)}
                                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/80 hover:bg-red-500 rounded px-1.5 py-0.5 text-[10px] font-medium"
                                >
                                  ✕
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="p-4 border-t border-white/10 flex justify-between items-center">
          <div className="text-xs text-white/40">{blocos.length} blocos no total</div>
          <Button variant="ghost" onClick={saveAll} disabled={saving}>
            {saving ? "A guardar..." : "Guardar alterações"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
