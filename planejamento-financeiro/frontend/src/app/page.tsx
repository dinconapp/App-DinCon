import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  ClipboardList,
  LogIn,
  MessageCircle,
  PiggyBank,
  ReceiptText,
  ShieldCheck,
  WalletCards
} from "lucide-react";

const modules = [
  {
    title: "Dashboard do mês",
    text: "Receitas, despesas, economia, saldo acumulado, rankings e gráficos por categoria.",
    icon: BarChart3
  },
  {
    title: "Fluxo de caixa",
    text: "Compare receitas previstas, contas fixas e lançamentos realizados no mês selecionado.",
    icon: CalendarDays
  },
  {
    title: "Lançamentos",
    text: "Cadastre entradas e saídas, filtre por tipo, categoria, origem e status de pagamento.",
    icon: ReceiptText
  },
  {
    title: "Contas",
    text: "Acompanhe contas fixas pendentes, pagas, recebidas e atrasadas sem duplicar trabalho.",
    icon: ClipboardList
  },
  {
    title: "Cofrinho",
    text: "Registre investimentos e veja distribuição, indicadores e projeções consolidadas.",
    icon: PiggyBank
  },
  {
    title: "WhatsApp",
    text: "Integração por Twilio para interpretar mensagens e áudios e gerar rascunhos de transações.",
    icon: MessageCircle
  }
];

const trustItems = [
  "Login seguro",
  "Pix ou cartão",
  "Tudo por mês"
];

export default function Home() {
  return (
    <main className="cf-lp">
      <nav className="cf-lp-nav" aria-label="Principal">
        <Link className="cf-lp-logo" href="/">
          <img src="/logo/dincon_logo_dark_mode.png" alt="DinCon" />
        </Link>
      </nav>

      <section className="cf-lp-hero">
        <div className="cf-lp-copy">
          <div className="cf-lp-pill">
            <ShieldCheck size={15} />
            Controle financeiro pessoal
          </div>
          <h1>DinCon</h1>
          <p>
            Entradas, saídas, contas fixas e investimentos organizados em um painel simples para acompanhar o mês.
          </p>
          <div className="cf-lp-actions">
            <Link className="cf-btn primary" href="/cadastro">Criar conta <ArrowRight size={17} /></Link>
            <Link className="cf-btn" href="/login">Entrar <LogIn size={17} /></Link>
          </div>
          <div className="cf-lp-trust">
            {trustItems.map((item) => (
              <span key={item}><Check size={15} />{item}</span>
            ))}
          </div>
        </div>

        <div className="cf-lp-product" aria-label="Prévia do dashboard DinCon">
          <div className="cf-lp-product-top">
            <span>Resumo de junho</span>
            <strong>Dashboard</strong>
          </div>
          <div className="cf-lp-kpi-grid">
            <div className="cf-lp-kpi income"><span>Entradas</span><strong>R$ 8.400</strong></div>
            <div className="cf-lp-kpi expense"><span>Saídas</span><strong>R$ 5.180</strong></div>
            <div className="cf-lp-kpi"><span>Economia</span><strong>38%</strong></div>
            <div className="cf-lp-kpi"><span>Saldo</span><strong>R$ 3.220</strong></div>
          </div>
          <div className="cf-lp-chart">
            <span style={{ height: "42%" }} />
            <span style={{ height: "68%" }} />
            <span style={{ height: "53%" }} />
            <span style={{ height: "81%" }} />
            <span style={{ height: "60%" }} />
            <span style={{ height: "74%" }} />
          </div>
          <div className="cf-lp-product-list">
            <div><WalletCards size={17} /><span>Internet</span><strong className="expense">-R$ 110</strong></div>
            <div><PiggyBank size={17} /><span>Tesouro Selic</span><strong className="income">+R$ 600</strong></div>
            <div><MessageCircle size={17} /><span>Rascunho via WhatsApp</span><strong>Pendente</strong></div>
          </div>
        </div>
      </section>

      <section className="cf-lp-strip" aria-label="Recursos principais">
        <span>Dashboard</span>
        <span>Fluxo de caixa</span>
        <span>Lançamentos</span>
        <span>Contas</span>
        <span>Cofrinho</span>
        <span>WhatsApp</span>
      </section>

      <section className="cf-lp-section" id="funcionalidades">
        <div className="cf-lp-section-head">
          <span>Funcionalidades</span>
          <h2>O que já existe no DinCon.</h2>
          <p>Recursos presentes no projeto atual: app autenticado, módulos financeiros, integração WhatsApp e assinatura.</p>
        </div>
        <div className="cf-lp-features">
          {modules.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title}>
                <Icon size={22} />
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="cf-lp-section cf-lp-flow" id="como-funciona">
        <div className="cf-lp-section-head">
          <span>Como funciona</span>
          <h2>Da previsão ao realizado, mês a mês.</h2>
        </div>
        <div className="cf-lp-steps">
          <article>
            <strong>1</strong>
            <h3>Planeje receitas e contas</h3>
            <p>Monte seus orçamentos, contas fixas e entradas esperadas no fluxo de caixa.</p>
          </article>
          <article>
            <strong>2</strong>
            <h3>Registre o movimento real</h3>
            <p>Adicione lançamentos manualmente ou acompanhe rascunhos vindos da integração com WhatsApp.</p>
          </article>
          <article>
            <strong>3</strong>
            <h3>Acompanhe o impacto</h3>
            <p>Veja dashboard, contas, projeção de saldo e cofrinho para decidir o próximo passo.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
