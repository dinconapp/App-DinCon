import Link from "next/link";
import { ArrowRight, BarChart3, CalendarRange, LockKeyhole, ReceiptText } from "lucide-react";

const features = [
  { title: "Dashboard financeiro", text: "Entradas, saídas, economia e saldo acumulado em uma visão objetiva.", icon: BarChart3 },
  { title: "Fluxo de caixa mensal", text: "Separe receitas previstas, contas fixas e lançamentos para controlar o mês.", icon: CalendarRange },
  { title: "Contas e lançamentos", text: "Registre pagamentos, gastos e receitas com leitura rápida.", icon: ReceiptText },
  { title: "Acesso protegido", text: "Cadastro, login e troca de senha com fluxo completo.", icon: LockKeyhole }
];

export default function Home() {
  return (
    <main className="cf-lp">
      <nav className="cf-lp-nav">
        <img src="/logo/dincon_logo_dark_mode.png" alt="DinCon" />
        <div>
          <Link href="/login">Entrar</Link>
          <Link className="cf-lp-nav-cta" href="/cadastro">Criar conta</Link>
        </div>
      </nav>
      <section className="cf-lp-hero">
        <div className="cf-lp-copy">
          <h1>DinCon</h1>
          <p>Controle financeiro pessoal com fluxo de caixa, lançamentos, contas e projeção mensal em uma plataforma escura, direta e fácil de acompanhar.</p>
          <div className="cf-lp-actions">
            <Link className="cf-btn primary" href="/cadastro">Comecar agora <ArrowRight size={17} /></Link>
            <Link className="cf-btn" href="/login">Já tenho conta</Link>
          </div>
        </div>
        <div className="cf-lp-panel">
          <div className="cf-lp-panel-head">
            <span>Resumo do mes</span>
            <strong>Junho</strong>
          </div>
          <div className="cf-lp-metric income"><span>Entradas</span><strong>R$ 8.400,00</strong></div>
          <div className="cf-lp-metric expense"><span>Saidas</span><strong>R$ 5.180,00</strong></div>
          <div className="cf-lp-bars"><span style={{ width: "72%" }} /><i style={{ width: "44%" }} /></div>
        </div>
      </section>
      <section className="cf-lp-features">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <article key={feature.title}>
              <Icon size={22} />
              <h2>{feature.title}</h2>
              <p>{feature.text}</p>
            </article>
          );
        })}
      </section>
    </main>
  );
}
