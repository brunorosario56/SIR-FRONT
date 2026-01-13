import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Card, Pill } from "../components/ui";
import { useAuth } from "../auth/AuthContext";
import type { AppOutletContext } from "../App";
import { getMyColegas, getMyEvents, getMyGroups, getMySchedule } from "../api/endpoints";
import type { StudyEvent } from "../api/types";

export default function Dashboard() {
  const { user } = useAuth();
  const { presence } = useOutletContext<AppOutletContext>();
  const navigate = useNavigate();

  const [counts, setCounts] = useState({ blocos: 0, grupos: 0, colegas: 0 });
  const [upcomingEvents, setUpcomingEvents] = useState<StudyEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, g, c, events] = await Promise.all([
          getMySchedule(), 
          getMyGroups(), 
          getMyColegas(),
          getMyEvents()
        ]);
        setCounts({ 
          blocos: s.blocos?.length || 0, 
          grupos: g.length || 0,
          colegas: c.colegas?.length || 0
        });
        
        // Filtrar eventos futuros e ordenar por data
        const now = new Date();
        const upcoming = events
          .filter(e => new Date(e.inicio) > now)
          .sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime())
          .slice(0, 5); // Mostrar apenas os próximos 5
        setUpcomingEvents(upcoming);
      } catch {
        // ignora
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const mePresence = useMemo(() => (user?._id ? presence[user._id] : undefined), [presence, user?._id]);

  const onlineColegasCount = useMemo(() => {
    return Object.values(presence).filter(p => p.online).length;
  }, [presence]);

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xl font-semibold">Dashboard</div>
        <div className="text-white/60 text-sm">Resumo da tua atividade</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="cursor-pointer bg-gradient-to-br from-blue-600/20 to-blue-700/10 border-blue-400/30 hover:border-blue-400/50 transition-all" onClick={() => navigate("/schedule")}>
          <div className="text-sm text-blue-300 font-medium">📚 Horário</div>
          <div className="text-4xl font-bold text-blue-50 mt-2">{counts.blocos}</div>
          <div className="text-xs text-blue-300/70 mt-1">blocos registados</div>
        </Card>

        <Card className="cursor-pointer bg-gradient-to-br from-purple-600/20 to-purple-700/10 border-purple-400/30 hover:border-purple-400/50 transition-all" onClick={() => navigate("/groups")}>
          <div className="text-sm text-purple-300 font-medium">👥 Grupos</div>
          <div className="text-4xl font-bold text-purple-50 mt-2">{counts.grupos}</div>
          <div className="text-xs text-purple-300/70 mt-1">onde és membro</div>
        </Card>

        <Card className="cursor-pointer bg-gradient-to-br from-green-600/20 to-green-700/10 border-green-400/30 hover:border-green-400/50 transition-all" onClick={() => navigate("/colegas")}>
          <div className="text-sm text-green-300 font-medium">🤝 Colegas</div>
          <div className="text-4xl font-bold text-green-50 mt-2">{counts.colegas}</div>
          <div className="text-xs text-green-300/70 mt-1">
            {onlineColegasCount > 0 ? `${onlineColegasCount} online 🟢` : "nenhum online"}
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-600/20 to-orange-700/10 border-orange-400/30">
          <div className="text-sm text-orange-300 font-medium">⚡ Presença</div>
          <div className="mt-3">
            <Pill className={mePresence?.online ? "bg-green-500/30 text-green-200 text-lg border-green-400/50" : "bg-white/10 text-white/70 text-lg border-white/20"}>
              {mePresence?.online ? "🟢 Online" : "⚫ Offline"}
            </Pill>
          </div>
          {mePresence?.lastSeen && !mePresence?.online && (
            <div className="text-xs text-white/50 mt-2">
              Visto: {new Date(mePresence.lastSeen).toLocaleString()}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-white/60">Próximos eventos</div>
            <button 
              className="text-xs text-white/60 hover:text-white"
              onClick={() => navigate("/study-sessions")}
            >
              Ver todos →
            </button>
          </div>
          
          {loading ? (
            <div className="text-sm text-white/50">A carregar...</div>
          ) : upcomingEvents.length === 0 ? (
            <div className="text-sm text-white/50">Sem eventos agendados</div>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.map((ev) => {
                const start = new Date(ev.inicio);
                const isToday = start.toDateString() === new Date().toDateString();
                const isTomorrow = start.toDateString() === new Date(Date.now() + 86400000).toDateString();
                
                let dateLabel = start.toLocaleDateString();
                if (isToday) dateLabel = "Hoje";
                else if (isTomorrow) dateLabel = "Amanhã";

                return (
                  <div key={ev._id} className="rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-600/10 to-blue-600/5 p-3 hover:border-cyan-400/50 transition-all cursor-pointer" onClick={() => navigate("/calendar")}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate text-cyan-50">{ev.titulo}</div>
                        <div className="text-xs text-cyan-300/80 mt-1">
                          📅 {dateLabel} • {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {ev.local && ` • ${ev.local}`}
                        </div>
                        {ev.descricao && (
                          <div className="text-xs text-white/50 mt-1 truncate">{ev.descricao}</div>
                        )}
                      </div>
                      {isToday && (
                        <Pill className="text-yellow-200 text-xs flex-shrink-0">Hoje</Pill>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <div className="text-sm text-white/60 mb-3">Atalhos rápidos</div>
          <div className="grid grid-cols-2 gap-2">
            <button 
              className="rounded-xl border border-white/10 p-4 hover:bg-white/10 transition text-left"
              onClick={() => navigate("/schedule")}
            >
              <div className="text-2xl mb-2">📅</div>
              <div className="text-sm font-medium">Editar horário</div>
              <div className="text-xs text-white/60 mt-1">{counts.blocos} blocos</div>
            </button>

            <button 
              className="rounded-xl border border-white/10 p-4 hover:bg-white/10 transition text-left"
              onClick={() => navigate("/groups")}
            >
              <div className="text-2xl mb-2">👥</div>
              <div className="text-sm font-medium">Grupos</div>
              <div className="text-xs text-white/60 mt-1">{counts.grupos} grupos</div>
            </button>

            <button 
              className="rounded-xl border border-white/10 p-4 hover:bg-white/10 transition text-left"
              onClick={() => navigate("/colegas")}
            >
              <div className="text-2xl mb-2">🤝</div>
              <div className="text-sm font-medium">Colegas</div>
              <div className="text-xs text-white/60 mt-1">{counts.colegas} colegas</div>
            </button>

            <button 
              className="rounded-xl border border-white/10 p-4 hover:bg-white/10 transition text-left"
              onClick={() => navigate("/compare")}
            >
              <div className="text-2xl mb-2">🔍</div>
              <div className="text-sm font-medium">Comparar</div>
              <div className="text-xs text-white/60 mt-1">Horários</div>
            </button>
          </div>
        </Card>
      </div>

      {counts.blocos === 0 && (
        <Card className="bg-blue-950/30 border-blue-500/30">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div className="flex-1">
              <div className="font-medium text-blue-200">Começa por definir o teu horário</div>
              <div className="text-sm text-blue-300/70 mt-1">
                Adiciona os blocos das tuas disciplinas para poderes encontrar horários livres em comum com os teus colegas.
              </div>
              <button 
                className="mt-3 text-sm text-blue-200 hover:text-blue-100 underline"
                onClick={() => navigate("/schedule")}
              >
                Ir para o horário →
              </button>
            </div>
          </div>
        </Card>
      )}

      {counts.colegas === 0 && counts.blocos > 0 && (
        <Card className="bg-purple-950/30 border-purple-500/30">
          <div className="flex items-start gap-3">
            <div className="text-2xl">👋</div>
            <div className="flex-1">
              <div className="font-medium text-purple-200">Adiciona os teus colegas</div>
              <div className="text-sm text-purple-300/70 mt-1">
                Envia pedidos de amizade para encontrar slots livres em comum e criar grupos de estudo.
              </div>
              <button 
                className="mt-3 text-sm text-purple-200 hover:text-purple-100 underline"
                onClick={() => navigate("/colegas")}
              >
                Adicionar colegas →
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
