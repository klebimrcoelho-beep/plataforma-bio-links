const cfg = window.APP_CONFIG;
const $ = (id) => document.getElementById(id);
const container = $("links");

function mostrarNaoEncontrado(titulo, texto) {
  document.title = "Perfil não encontrado";
  $("perfil").classList.add("hidden");
  container.classList.add("hidden");
  $("erro-titulo").textContent = titulo;
  $("erro-texto").textContent = texto;
  $("erro").classList.remove("hidden");
}

function renderPerfil(p) {
  document.title = `${p.nome_exibicao} | Links`;
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.content = p.bio || `Links de ${p.nome_exibicao}`;

  $("usuario").textContent = p.nome_exibicao;
  $("bio").textContent = p.bio || "";
  $("handle").textContent = "@" + p.username;

  const avatar = $("avatar");
  avatar.textContent = "";
  if (p.foto_url) {
    const img = document.createElement("img");
    img.src = p.foto_url;
    img.alt = p.nome_exibicao;
    img.className = "h-full w-full rounded-full object-cover";
    avatar.appendChild(img);
  } else {
    avatar.textContent = p.nome_exibicao.trim().slice(0, 2).toUpperCase();
  }
  $("perfil").classList.remove("invisible");
}

// URLs seguras apenas (evita javascript:)
function urlSegura(u) {
  return /^(https?:|mailto:|tel:)/i.test(u) ? u : "#";
}

function renderLinks(links) {
  container.innerHTML = "";
  if (!links.length) {
    const p = document.createElement("p");
    p.className = "text-center text-sm text-zinc-500";
    p.textContent = "Nenhum link disponível.";
    container.appendChild(p);
    return;
  }
  links.forEach((l, i) => {
    const a = document.createElement("a");
    a.href = urlSegura(l.url);
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.style.animationDelay = `${i * 70}ms`;
    a.className =
      "link-btn fade-up flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur";

    const icon = document.createElement("i");
    icon.className = `${l.icone || "fa-solid fa-link"} w-6 text-center text-lg text-violet-400`;

    const span = document.createElement("span");
    span.className = "flex-1 pr-6 text-center font-medium";
    span.textContent = l.titulo;

    a.append(icon, span);
    container.appendChild(a);
  });
}

async function buscarPerfil(client, username) {
  const { data, error } = await client
    .from("perfis")
    .select("id,username,nome_exibicao,bio,foto_url")
    .eq("username", username)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function buscarLinks(client, perfilId) {
  const { data, error } = await client
    .from("links")
    .select("titulo,url,icone,ordem")
    .eq("perfil_id", perfilId)
    .eq("ativo", true)
    .order("ordem", { ascending: true });
  if (error) throw error;
  return data;
}

async function init() {
  const params = new URLSearchParams(location.search);
  const pathUser = location.pathname.split("/").filter(Boolean).pop() || "";
  const fromPath = /\.\w+$/.test(pathUser) ? "" : pathUser; // ignora index.html
  const username = (params.get("u") || fromPath).trim().toLowerCase();

  if (!username) {
    return mostrarNaoEncontrado(
      "Perfil não encontrado",
      "Nenhum usuário foi informado na URL. Exemplo: ?u=seu_usuario"
    );
  }

  try {
    const client = supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    const perfil = await buscarPerfil(client, username);
    if (!perfil) {
      return mostrarNaoEncontrado(
        "Perfil não encontrado",
        `O usuário "@${username}" não existe ou foi removido.`
      );
    }
    renderPerfil(perfil);
    renderLinks(await buscarLinks(client, perfil.id));
  } catch (err) {
    console.error(err);
    mostrarNaoEncontrado(
      "Algo deu errado",
      "Não foi possível carregar este perfil. Tente novamente em instantes."
    );
  }
}

init();
