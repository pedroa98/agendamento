# 🔧 Correção de Rotas e Menus - Guia Completo

## ✅ Arquivo Atualizado

- ✅ estabelecimento/agenda/index.html

## 📝 Arquivos Pendentes de Atualização

### 🏢 Estabelecimento:
- [ ] estabelecimento/editar-perfil/index.html
- [ ] estabelecimento/interesses/index.html  
- [ ] estabelecimento/meus-clientes/index.html
- [ ] estabelecimento/meus-profissionais/index.html

### 👨‍⚕️ Profissional:
- [ ] profissional/agenda/index.html
- [ ] profissional/editar-perfil/index.html
- [ ] profissional/interesses/index.html
- [ ] profissional/meus-clientes/index.html

### 👤 Cliente:
- [ ] cliente/agenda/index.html
- [ ] cliente/editar-perfil/index.html

---

## 🔄 Mudanças Necessárias em Cada Arquivo

### 1. **Adicionar no <head>:**
```html
<link rel="stylesheet" href="../../css/sidebar.css">
<link rel="stylesheet" href="../../css/dashboard-modern.css">
<script src="../../js/sidebar.js" defer></script>
```

### 2. **Remover CSS inline antigo** (se houver):
```html
<!-- REMOVER -->
<style>
  body { margin:0; font-family: 'Poppins', sans-serif; display:flex; min-height:100vh; background:#f4f6f8 }
  .sidebar { width: 240px; background: #2c3e50; ... }
  .sidebar a { color: #fff; text-decoration: none; ... }
  ...
</style>
```

### 3. **Atualizar Loading Overlay:**
```html
<!-- DE: -->
<div id="loading-overlay">
  <div class="spinner"></div>
</div>

<!-- PARA: -->
<div id="loading-overlay" class="loading-overlay">
  <div class="spinner"></div>
  <div class="loading-text">Carregando...</div>
</div>
```

### 4. **Atualizar Container:**
```html
<!-- ENVOLVER TUDO EM: -->
<div class="dashboard-container">
  <!-- sidebar aqui -->
  <!-- main-content aqui -->
</div>
```

### 5. **Substituir Sidebar Antigo:**

#### ❌ ANTES (Estabelecimento):
```html
<div class="sidebar">
  <h2>AutoCuidado</h2>
  <a href="../dashboard/"><i class="fas fa-home"></i> Dashboard</a>
  <a href="../meus-clientes/"><i class="fas fa-users"></i> Meus Clientes</a>
  <a href="../agenda/"><i class="fas fa-calendar"></i> Agenda</a>
  <a href="../editar-perfil/"><i class="fas fa-edit"></i> Editar Perfil</a>
  <a href="../../login.html"><i class="fas fa-sign-out-alt"></i> Logout</a>
</div>
```

#### ✅ DEPOIS (Estabelecimento):
```html
<aside class="sidebar">
  <div class="sidebar-header">
    <h2><i class="fas fa-heart-pulse"></i> AutoCuidado</h2>
    <p class="brand-subtitle">Estabelecimento</p>
  </div>
  <nav>
    <a href="../dashboard/" class="menu-btn"><i class="fas fa-home"></i> <span>Dashboard</span></a>
    <a href="../meus-clientes/" class="menu-btn"><i class="fas fa-users"></i> <span>Meus Clientes</span></a>
    <a href="../interesses/" class="menu-btn"><i class="fas fa-comments"></i> <span>Interessados</span></a>
    <a href="../agenda/" class="menu-btn"><i class="fas fa-calendar-alt"></i> <span>Agenda</span></a>
    <a href="../meus-profissionais/" class="menu-btn"><i class="fas fa-user-tie"></i> <span>Profissionais</span></a>
    <a href="../editar-perfil/" class="menu-btn"><i class="fas fa-user-edit"></i> <span>Editar Perfil</span></a>
    <a href="../../login.html" class="menu-btn logout"><i class="fas fa-sign-out-alt"></i> <span>Sair</span></a>
  </nav>
</aside>
```

#### ✅ DEPOIS (Profissional):
```html
<aside class="sidebar">
  <div class="sidebar-header">
    <h2><i class="fas fa-heart-pulse"></i> AutoCuidado</h2>
    <p class="brand-subtitle">Profissional</p>
  </div>
  <nav>
    <a href="../dashboard/" class="menu-btn"><i class="fas fa-home"></i> <span>Dashboard</span></a>
    <a href="../meus-clientes/" class="menu-btn"><i class="fas fa-users"></i> <span>Meus Clientes</span></a>
    <a href="../interesses/" class="menu-btn"><i class="fas fa-comments"></i> <span>Interessados</span></a>
    <a href="../agenda/" class="menu-btn"><i class="fas fa-calendar-alt"></i> <span>Agenda</span></a>
    <a href="../editar-perfil/" class="menu-btn"><i class="fas fa-user-edit"></i> <span>Editar Perfil</span></a>
    <a href="../../login.html" class="menu-btn logout"><i class="fas fa-sign-out-alt"></i> <span>Sair</span></a>
  </nav>
</aside>
```

#### ✅ DEPOIS (Cliente):
```html
<aside class="sidebar">
  <div class="sidebar-header">
    <h2><i class="fas fa-heart-pulse"></i> AutoCuidado</h2>
    <p class="brand-subtitle">Cliente</p>
  </div>
  <nav>
    <a href="../dashboard/" class="menu-btn"><i class="fas fa-home"></i> <span>Dashboard</span></a>
    <a href="../../lista-servicos.html" class="menu-btn"><i class="fas fa-search"></i> <span>Buscar Serviços</span></a>
    <a href="../agenda/" class="menu-btn"><i class="fas fa-calendar-alt"></i> <span>Minha Agenda</span></a>
    <a href="../editar-perfil/" class="menu-btn"><i class="fas fa-user-edit"></i> <span>Editar Perfil</span></a>
    <a href="../../login.html" class="menu-btn logout"><i class="fas fa-sign-out-alt"></i> <span>Sair</span></a>
  </nav>
</aside>
```

---

## 🎯 Pontos de Atenção

### Classe 'active'
Adicione a classe `active` ao menu item correspondente à página atual:
```html
<!-- Se estiver na página de agenda: -->
<a href="../agenda/" class="menu-btn active">
```

### Estrutura do Main Content
Certifique-se de que o conteúdo principal está em:
```html
<main class="main-content fade-in">
  <!-- conteúdo aqui -->
</main>
```

### Scripts Específicos
Mantenha os scripts específicos de cada página (ex: fullcalendar, jsPDF) mas adicione os novos scripts do sidebar.

---

## ✨ Benefícios Após Atualização

- ✅ Menu lateral responsivo com hamburguer mobile
- ✅ Animações suaves de entrada
- ✅ Visual moderno e profissional
- ✅ Navegação consistente em todas as páginas
- ✅ Overlay mobile com blur
- ✅ Auto-fechamento inteligente
- ✅ Indicador de página ativa
- ✅ Suporte a teclado (ESC fecha menu)

---

## 📋 Checklist de Verificação

Após atualizar cada arquivo, verifique:

- [ ] CSS sidebar.css e dashboard-modern.css incluídos
- [ ] Script sidebar.js incluído
- [ ] Loading overlay atualizado
- [ ] Sidebar com novo template
- [ ] Nav items com `<span>` wrapper
- [ ] Classe `active` no item correto
- [ ] Container `dashboard-container` presente
- [ ] Main content com classe correta
- [ ] CSS inline antigo removido
- [ ] Rotas relativas corretas (../)
- [ ] Teste mobile (menu hamburguer funciona)
- [ ] Teste desktop (menu fixo funciona)
