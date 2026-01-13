import { useEffect, useState, type FormEvent } from "react";
import { Page } from "../components/Page";
import { Card } from "../components/ui";
import { authMe, changePassword, getMyStats, updateProfile } from "../api/endpoints";
import type { User } from "../api/types";

interface Stats {
  totalColegas: number;
  totalGroups: number;
  ownedGroups: number;
  totalBlocos: number;
  upcomingEvents: number;
  pastEvents: number;
  totalEvents: number;
}

export function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Profile edit
  const [editingProfile, setEditingProfile] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  
  // Password change
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [userData, statsData] = await Promise.all([authMe(), getMyStats()]);
      setUser(userData);
      setStats(statsData);
      setNome(userData.nome);
      setEmail(userData.email);
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateProfile(e: FormEvent) {
    e.preventDefault();
    try {
      await updateProfile({ nome, email });
      setMessage("Perfil atualizado com sucesso!");
      setEditingProfile(false);
      await loadData();
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Erro ao atualizar perfil");
    }
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage("As passwords não coincidem");
      return;
    }
    
    if (newPassword.length < 6) {
      setMessage("A nova password deve ter pelo menos 6 caracteres");
      return;
    }

    try {
      await changePassword(currentPassword, newPassword);
      setMessage("Password alterada com sucesso!");
      setChangingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Erro ao alterar password");
    }
  }

  if (loading) {
    return <Page title="Perfil"><p className="text-gray-600">A carregar...</p></Page>;
  }

  return (
    <Page title="Perfil">
      <div className="space-y-6">
        {message && (
          <div className={`p-4 rounded-lg ${message.includes("sucesso") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {message}
          </div>
        )}

        {/* Basic Info */}
        <Card className="p-6 bg-gradient-to-br from-indigo-600/10 to-purple-600/5 border-indigo-400/30">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
              <span className="text-4xl text-white font-bold">
                {user?.nome.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-indigo-50">{user?.nome}</h2>
              <p className="text-indigo-300">{user?.email}</p>
              <p className="text-sm text-indigo-300/70 mt-1">Membro desde {new Date(user?.createdAt || "").toLocaleDateString("pt-PT")}</p>
            </div>
          </div>
        </Card>

        {/* Statistics */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">📊 Estatísticas</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-green-600/20 to-emerald-600/10 border border-green-400/30 rounded-lg hover:border-green-400/50 transition-all">
              <div className="text-3xl font-bold text-green-50">👥 {stats?.totalColegas || 0}</div>
              <div className="text-sm text-green-300 mt-1">Colegas</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-600/20 to-violet-600/10 border border-purple-400/30 rounded-lg hover:border-purple-400/50 transition-all">
              <div className="text-3xl font-bold text-purple-50">🏸️ {stats?.totalGroups || 0}</div>
              <div className="text-sm text-purple-300 mt-1">Grupos</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-blue-600/20 to-cyan-600/10 border border-blue-400/30 rounded-lg hover:border-blue-400/50 transition-all">
              <div className="text-3xl font-bold text-blue-50">📚 {stats?.totalBlocos || 0}</div>
              <div className="text-sm text-blue-300 mt-1">Blocos</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-orange-600/20 to-red-600/10 border border-orange-400/30 rounded-lg hover:border-orange-400/50 transition-all">
              <div className="text-3xl font-bold text-orange-50">📅 {stats?.upcomingEvents || 0}</div>
              <div className="text-sm text-orange-300 mt-1">Eventos Futuros</div>
            </div>
          </div>
          <div className="mt-4 text-sm text-white/70 space-y-1">
            <p>Total de eventos: {stats?.totalEvents || 0} ({stats?.pastEvents || 0} passados)</p>
            {stats?.ownedGroups ? <p>👑 Administrador de {stats.ownedGroups} grupo(s)</p> : null}
          </div>
        </Card>

        {/* Edit Profile */}
        <Card className="p-6 bg-gradient-to-br from-blue-600/10 to-cyan-600/5 border-blue-400/30">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-blue-100">✏️ Informações do Perfil</h3>
            <button
              onClick={() => setEditingProfile(!editingProfile)}
              className="px-4 py-2 bg-gradient-to-br from-blue-600/30 to-cyan-600/20 border border-blue-400/50 text-blue-100 rounded-lg hover:border-blue-400/70 transition-all font-medium"
            >
              {editingProfile ? "Cancelar" : "✏️ Editar"}
            </button>
          </div>

          {editingProfile ? (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-1">Nome</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-blue-400/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-blue-400/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-br from-blue-600 to-cyan-600 text-white py-2 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all font-medium shadow-lg"
              >
                ✓ Guardar Alterações
              </button>
            </form>
          ) : (
            <div className="space-y-2 text-blue-100">
              <p><strong>Nome:</strong> {user?.nome}</p>
              <p><strong>Email:</strong> {user?.email}</p>
            </div>
          )}
        </Card>

        {/* Change Password */}
        <Card className="p-6 bg-gradient-to-br from-purple-600/10 to-pink-600/5 border-purple-400/30">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-purple-100">🔒 Alterar Password</h3>
            <button
              onClick={() => setChangingPassword(!changingPassword)}
              className="px-4 py-2 bg-gradient-to-br from-purple-600/30 to-pink-600/20 border border-purple-400/50 text-purple-100 rounded-lg hover:border-purple-400/70 transition-all font-medium"
            >
              {changingPassword ? "Cancelar" : "🔒 Alterar Password"}
            </button>
          </div>

          {changingPassword ? (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-1">Password Atual</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-purple-400/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-1">Nova Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-purple-400/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-1">Confirmar Nova Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-purple-400/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50"
                  required
                  minLength={6}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-br from-purple-600 to-pink-600 text-white py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium shadow-lg"
              >
                ✓ Alterar Password
              </button>
            </form>
          ) : (
            <p className="text-purple-300/70">Clique em "Alterar Password" para atualizar a sua password.</p>
          )}
        </Card>


      </div>
    </Page>
  );
}
