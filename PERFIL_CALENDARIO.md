# Novas Funcionalidades: Perfil e Calendário

## 📝 Resumo
Implementadas duas novas funcionalidades principais:
1. **Página de Perfil do Utilizador**
2. **Vista de Calendário Visual para Eventos**

---

## 🔧 Backend (SIR_PL)

### Endpoints Adicionados

#### 1. PUT `/auth/me` - Atualizar Perfil
- **Descrição**: Permite atualizar nome, email e avatar do utilizador
- **Body**:
  ```json
  {
    "nome": "Nome Atualizado",
    "email": "novo@email.com",
    "avatar": "https://exemplo.com/avatar.jpg"
  }
  ```
- **Validações**:
  - Verifica se o novo email já está em uso por outro utilizador
  - Todos os campos são opcionais

#### 2. PUT `/auth/me/password` - Alterar Password
- **Descrição**: Permite alterar a password do utilizador
- **Body**:
  ```json
  {
    "currentPassword": "senhaAtual123",
    "newPassword": "novaSenha456"
  }
  ```
- **Validações**:
  - Verifica se a password atual está correta
  - Nova password deve ter no mínimo 6 caracteres

#### 3. GET `/auth/me/stats` - Estatísticas do Utilizador
- **Descrição**: Retorna estatísticas completas do utilizador
- **Response**:
  ```json
  {
    "totalColegas": 5,
    "totalGroups": 3,
    "ownedGroups": 1,
    "totalBlocos": 12,
    "upcomingEvents": 4,
    "pastEvents": 10,
    "totalEvents": 14
  }
  ```

### Modelo User Atualizado
- **Novo campo**: `avatar` (String, opcional)
- Permite guardar URL de imagem de avatar

---

## 🎨 Frontend (SIR-FRONT)

### 1. ProfilePage (`/profile`)

#### Funcionalidades
✅ **Visualização de Perfil**
- Avatar circular (imagem ou inicial do nome)
- Nome, email e data de registo
- Estatísticas visuais em cards coloridos

✅ **Edição de Perfil**
- Formulário para editar nome, email e avatar
- Validação de campos obrigatórios
- Feedback visual de sucesso/erro

✅ **Alteração de Password**
- Formulário separado com validação
- Verifica se as passwords coincidem
- Mínimo de 6 caracteres
- Confirmação de password atual

✅ **Estatísticas**
- 4 cards principais: Colegas, Grupos, Blocos, Eventos Futuros
- Informações adicionais: Total de eventos, eventos passados, grupos administrados

✅ **Configurações de Privacidade**
- Interface preparada para futuras implementações
- Checkboxes para visibilidade de horário, disponibilidade e notificações

#### Design
- Layout responsivo com grid
- Cards com cores temáticas (azul, roxo, verde, laranja)
- Formulários com validação e feedback imediato
- Modo de edição toggle (Editar/Cancelar)

---

### 2. CalendarPage (`/calendar`)

#### Funcionalidades
✅ **Múltiplas Vistas**
- **Vista Mensal**: Calendário completo com grid 7x6
- **Vista Semanal**: Lista de eventos da semana (em desenvolvimento)
- **Vista Diária**: Eventos detalhados do dia selecionado

✅ **Navegação**
- Botões para mês/semana/dia anterior/seguinte
- Botão "Hoje" para voltar à data atual
- Indicador visual do dia atual (borda azul)

✅ **Visualização de Eventos**
- Eventos mostrados em cada dia do calendário
- Cores por grupo (8 cores diferentes)
- Hora de início + título truncado
- Indicador "+X mais" quando há muitos eventos
- Legenda de cores dos grupos

✅ **Criação Rápida de Eventos**
- Clique em qualquer dia abre modal de criação
- Formulário completo: título, grupo, início, fim, local, descrição
- Pré-preenchimento da data selecionada
- Validação de campos obrigatórios

✅ **Integração**
- Usa eventos existentes da API
- Sincroniza com grupos do utilizador
- Atualização automática após criar evento

#### Design
- Grid de calendário responsivo
- Cores distintas para cada grupo
- Destaque para dia atual
- Dias fora do mês com background cinzento
- Modal centralizado para criação rápida

---

## 🔄 Outras Alterações

### Tipos TypeScript Atualizados
```typescript
// types.ts
export type User = {
  _id: string;
  nome: string;
  email: string;
  avatar?: string;        // NOVO
  createdAt?: string;     // NOVO
};

export type StudyEvent = {
  _id: string;
  grupo: Group;           // ATUALIZADO (era "group")
  criador: string | User; // ATUALIZADO
  // ... resto dos campos
};
```

### API Client (`endpoints.ts`)
Novos métodos adicionados:
- `updateProfile(body: { nome?, email?, avatar? })`
- `changePassword(currentPassword, newPassword)`
- `getMyStats()` - Retorna estatísticas do utilizador

### Navegação (`AppShell.tsx`)
- Adicionados links "Perfil" e "Calendário" no menu lateral
- NavKey atualizado: `"profile" | "calendar"`

### Rotas (`App.tsx`)
- `/profile` → ProfilePage
- `/calendar` → CalendarPage
- Mapeamento de navegação atualizado

---

## 📊 Melhorias de UX

### ProfilePage
- ✅ Mensagens de sucesso/erro com auto-hide (3s)
- ✅ Modo de edição toggle para evitar alterações acidentais
- ✅ Avatar placeholder com inicial quando não há imagem
- ✅ Validação de confirmação de password
- ✅ Cards de estatísticas com cores temáticas
- ✅ Layout responsivo (mobile-friendly)

### CalendarPage
- ✅ Navegação intuitiva entre vistas
- ✅ Destaque visual do dia atual
- ✅ Quick create ao clicar no dia
- ✅ Cores consistentes entre grupos
- ✅ Tooltip com título completo do evento
- ✅ Limitação de 3 eventos visíveis por dia + contador

---

## 🚀 Como Usar

### Acessar Perfil
1. Fazer login na aplicação
2. Clicar em "Perfil" no menu lateral
3. Ver estatísticas e informações
4. Clicar "Editar" para alterar dados
5. Ou "Alterar Password" para mudar senha

### Usar Calendário
1. Clicar em "Calendário" no menu lateral
2. Navegar entre meses com botões `‹` `›`
3. Alternar vista: Mês / Semana / Dia
4. Clicar em qualquer dia para criar evento rápido
5. Ver eventos coloridos por grupo

---

## 🔮 Melhorias Futuras Sugeridas

### ProfilePage
- [ ] Upload de imagem de avatar (vs. apenas URL)
- [ ] Implementar funcionalidade de privacidade (toggles funcionais)
- [ ] Gráficos de atividade ao longo do tempo
- [ ] Histórico de alterações
- [ ] Exportar dados do perfil

### CalendarPage
- [ ] Drag & drop para reagendar eventos
- [ ] Vista semanal completa com timeline
- [ ] Filtros por grupo
- [ ] Exportar calendário (iCal)
- [ ] Notificações/lembretes de eventos
- [ ] Integração com Google Calendar
- [ ] Vista de agenda (lista cronológica)
- [ ] Recorrência de eventos
- [ ] Convidar membros por evento

---

## 📝 Notas Técnicas

- Todos os endpoints de perfil estão protegidos com `authMiddleware`
- Stats são calculadas dinamicamente no backend
- Avatar suporta qualquer URL de imagem (não há upload de ficheiro)
- Calendário usa biblioteca nativa de datas (sem dependências extras)
- Vista mensal sempre mostra 42 dias (6 semanas)
- Eventos são ordenados por data de início

---

**Data**: ${new Date().toLocaleDateString('pt-PT')}
**Status**: ✅ Implementação Completa
