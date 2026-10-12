-- ============================================================
-- Bio Links SaaS multi-tenant
-- ATENÇÃO: recria a tabela links (apaga os dados antigos)
-- ============================================================
drop table if exists public.links cascade;
drop table if exists public.perfis cascade;

create table public.perfis (
  id bigint generated always as identity primary key,
  username text not null unique
    check (username ~ '^[a-z0-9_.-]{2,40}$'),
  nome_exibicao text not null,
  bio text,
  foto_url text,
  created_at timestamptz default now()
);

create table public.links (
  id bigint generated always as identity primary key,
  perfil_id bigint not null references public.perfis(id) on delete cascade,
  titulo text not null,
  url text not null,
  icone text default 'fa-solid fa-link', -- classe Font Awesome
  ordem int not null default 0,
  ativo boolean not null default true,
  created_at timestamptz default now()
);

create index links_perfil_id_idx on public.links (perfil_id, ordem);

-- RLS: leitura pública (anon) em ambas as tabelas
alter table public.perfis enable row level security;
alter table public.links enable row level security;

create policy "Leitura publica de perfis"
  on public.perfis for select to anon, authenticated
  using (true);

create policy "Leitura publica de links ativos"
  on public.links for select to anon, authenticated
  using (ativo = true);

-- ============================================================
-- Dados de teste
-- ============================================================
insert into public.perfis (username, nome_exibicao, bio, foto_url) values
  ('conexaoartevisual', 'Conexão Arte Visual', 'Design, identidade visual e criação digital', null),
  ('cliente2', 'Cliente Dois', 'Fotógrafo & Criador de Conteúdo', null);

insert into public.links (perfil_id, titulo, url, icone, ordem)
select p.id, v.titulo, v.url, v.icone, v.ordem
from public.perfis p
join (values
  ('conexaoartevisual', 'Instagram', 'https://www.instagram.com/conexaoartevisual/', 'fa-brands fa-instagram', 1),
  ('conexaoartevisual', 'WhatsApp', 'https://wa.me/', 'fa-brands fa-whatsapp', 2),
  ('conexaoartevisual', 'Portfólio', 'https://seusite.com', 'fa-solid fa-globe', 3),
  ('cliente2', 'Instagram', 'https://instagram.com/', 'fa-brands fa-instagram', 1),
  ('cliente2', 'YouTube', 'https://youtube.com/', 'fa-brands fa-youtube', 2),
  ('cliente2', 'Contato por e-mail', 'mailto:contato@exemplo.com', 'fa-solid fa-envelope', 3)
) as v(username, titulo, url, icone, ordem) on v.username = p.username;
