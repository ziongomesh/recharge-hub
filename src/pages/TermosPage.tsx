import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-background text-foreground noise">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-6 md:px-10 py-6 flex items-center justify-between">
          <Link to="/" className="font-display text-2xl">
            Cometa<em className="italic">sms</em>.
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft size={12} /> Voltar ao cadastro
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 md:px-10 py-12">
        <div className="label-eyebrow">Documento legal</div>
        <h1 className="font-display text-5xl md:text-6xl leading-none mt-3">Termos de uso.</h1>
        <p className="text-sm text-ink-soft mt-4">
          Ao usar a plataforma <strong>CometaSMS</strong>, você concorda expressa e integralmente com os
          presentes Termos de Uso. Leia com atenção antes de finalizar o cadastro.
        </p>
        <p className="text-xs text-muted-foreground mt-2 font-mono-x">
          Última alteração: 17/04/2026
        </p>

        <Accordion type="single" collapsible className="mt-10 space-y-3">

          <Item value="i1" title="1. Interpretação">
            <p>
              As palavras cuja letra inicial é maiúscula têm significados definidos nas seguintes condições.
              As definições terão o mesmo significado independentemente de aparecerem no singular ou no plural.
              Quaisquer termos usados, mas não especificados nos presentes Termos, serão interpretados conforme
              o contexto da Plataforma.
            </p>
          </Item>

          <Item value="i2" title="2. Definições">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>"Empresa"</strong> (referida como "Nós" ou "Nosso") significa a CometaSMS, proprietária da Plataforma.</li>
              <li><strong>"Plataforma"</strong> refere-se ao site da CometaSMS e qualquer aplicativo, bot ou sistema relacionado, incluindo todo conteúdo e funcionalidade apresentados.</li>
              <li><strong>"Serviços"</strong> significa todos os serviços prestados pela CometaSMS, em especial a <strong>recarga de créditos para celulares pré-pagos</strong> das operadoras Vivo, Claro, TIM e demais disponíveis na Plataforma.</li>
              <li><strong>"Usuário"</strong> significa o indivíduo que completou o procedimento de registro na Plataforma, é maior de 18 anos e não tem restrições legais para celebrar contratos vinculativos com a Empresa.</li>
              <li><strong>"Recarga"</strong> significa a operação de adição de créditos a uma linha móvel pré-paga executada através da Plataforma mediante pagamento prévio do Usuário via PIX.</li>
              <li><strong>"Saldo"</strong> significa o valor em reais (R$) creditado na conta do Usuário dentro da Plataforma após a confirmação de um depósito via PIX e que pode ser usado para solicitar recargas.</li>
              <li><strong>"Credenciais"</strong> refere-se às informações usadas para fazer login (e-mail e senha).</li>
              <li><strong>"Você"</strong> significa o indivíduo que acessa a Plataforma.</li>
            </ul>
          </Item>

          <Item value="i3" title="3. Regras gerais">
            <p>Estes Termos definem as práticas aceitáveis para o uso dos Serviços e protegem os interesses, a reputação e os recursos da CometaSMS e dos Usuários.</p>
            <p>Você reconhece que leu, entendeu e concorda com os Termos, incluindo o direito da CometaSMS de rescindir Seu registro por violações de quaisquer disposições aqui previstas. Caso discorde de qualquer parte, interrompa o procedimento de registro.</p>
            <p>Você declara que tem mais de 18 anos e não possui restrições legais para celebrar contratos com a CometaSMS. A Empresa não permite que menores de 18 anos utilizem os serviços.</p>
            <p>A CometaSMS reserva-se o direito de modificar estes Termos a qualquer momento. Qualquer modificação é eficaz imediatamente após publicação na Plataforma. Você concorda em verificar esta página periodicamente.</p>
          </Item>

          <Item value="i4" title="4. Serviços de recarga">
            <p>A CometaSMS atua como <strong>intermediadora entre o Usuário e as operadoras de telefonia móvel</strong>, processando o pedido de recarga junto a parceiros e gateways homologados.</p>
            <p>Em nenhum caso a CometaSMS será responsável por bloqueios, suspensões, portabilidades, indisponibilidades ou políticas internas das operadoras de telefonia que possam afetar o recebimento da recarga pelo titular da linha.</p>
            <p>O Usuário declara que é o titular da linha a ser recarregada ou que possui autorização expressa do titular para realizar a operação.</p>
          </Item>

          <Item value="i5" title="5. Cadastro de usuários">
            <p>Para utilizar os Serviços, o Usuário deve completar o cadastro fornecendo:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Nome de usuário (obrigatório);</li>
              <li>E-mail (obrigatório);</li>
              <li>Telefone (obrigatório);</li>
              <li><strong>CPF (obrigatório)</strong> — exigido para fins de prevenção a fraudes e por requisito de algumas operadoras durante o processamento da recarga;</li>
              <li>Senha de acesso (obrigatória).</li>
            </ul>
            <p>O processamento e armazenamento dos dados acima é regulado pela nossa Política de Privacidade. O Usuário garante que todas as informações fornecidas são verdadeiras e atualizadas.</p>
          </Item>

          <Item value="i6" title="6. Depósitos e uso da plataforma">
            <p>Para realizar uma recarga, o Usuário precisa primeiro depositar saldo em sua conta através do menu <em>Pagamentos</em>, utilizando exclusivamente <strong>PIX</strong> como meio de pagamento.</p>
            <p>Após confirmação automática do PIX, o saldo correspondente é creditado na conta do Usuário e fica imediatamente disponível para solicitar recargas.</p>
            <p>Ao solicitar uma recarga, o Usuário deve informar corretamente o número de telefone, a operadora e o valor desejado. <strong>A CometaSMS não se responsabiliza por recargas enviadas a números digitados incorretamente</strong> pelo próprio Usuário.</p>
          </Item>

          <Item value="i7" title="7. Política de reembolso">
            <p>Não é permitido o saque do saldo disponível na Plataforma, exceto nos casos de reembolso previstos abaixo.</p>
            <p>O Usuário poderá solicitar reembolso de uma recarga apenas quando:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>A recarga for marcada como <em>cancelada</em>, <em>expirada</em> ou <em>reembolsada</em> pela operadora ou pelo nosso provedor — nestes casos o estorno do valor para o saldo da Plataforma é <strong>automático</strong>;</li>
              <li>O Usuário comprovar, em até <strong>1 hora após a recarga</strong>, que a operação não foi processada e os créditos não chegaram à linha.</li>
            </ul>
            <p>O reembolso ocorre, como regra, mediante crédito do valor de volta no <strong>saldo da Plataforma</strong>. Reembolsos para meios de pagamento externos (devolução PIX) só serão avaliados em situações excepcionais e mediante análise.</p>
            <p>O prazo de verificação do pedido de reembolso é de até <strong>5 dias úteis</strong>, contados do envio de todas as informações solicitadas pela CometaSMS.</p>
            <p>Você concorda que os registros internos da Plataforma (logs de transação, status retornado pela operadora e protocolo do parceiro) serão considerados prova suficiente do resultado da recarga.</p>
          </Item>

          <Item value="i8" title="8. Resolução de reclamações">
            <p>Caso tenha qualquer reclamação, abra um chamado pelo nosso canal de atendimento informando data, hora, número da linha, valor e descrição do problema. A CometaSMS responderá no prazo máximo de 14 dias corridos.</p>
          </Item>

          <Item value="i9" title="9. Garantias do usuário">
            <p>O Usuário garante que:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Manterá a confidencialidade das suas credenciais de acesso (e-mail e senha) e notificará imediatamente em caso de suspeita de comprometimento;</li>
              <li>A conta criada será utilizada exclusivamente por ele;</li>
              <li>É maior de 18 anos e não possui restrições legais para contratar;</li>
              <li>Utilizará a Plataforma de forma lícita e em conformidade com estes Termos;</li>
              <li>Todos os dados fornecidos são verdadeiros, sendo o único responsável por sua veracidade.</li>
            </ul>
          </Item>

          <Item value="i10" title="10. Usos restritos">
            <p>É proibido utilizar a CometaSMS para:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Praticar qualquer atividade ilícita, fraudulenta ou que viole leis e regulamentos brasileiros;</li>
              <li>Realizar recargas com recursos provenientes de fontes ilícitas ou cartões/PIX de terceiros sem autorização;</li>
              <li>Tentar burlar, automatizar ou explorar falhas dos sistemas de pagamento ou de recarga;</li>
              <li>Revender os Serviços sem autorização expressa por escrito da CometaSMS;</li>
              <li>Usar a Plataforma para qualquer prática que prejudique a Empresa, terceiros ou o ecossistema das operadoras.</li>
            </ul>
          </Item>

          <Item value="i11" title="11. Tráfego suspeito">
            <p>A CometaSMS monitora ativamente o uso da Plataforma. Caso seja detectado qualquer comportamento incomum, suspeito ou indicativo de fraude, a Empresa poderá, a seu exclusivo critério, suspender total ou parcialmente a conta do Usuário e reter operações pendentes até a conclusão da análise.</p>
          </Item>

          <Item value="i12" title="12. Consequências de usos proibidos">
            <p>A CometaSMS pode tomar medidas imediatas contra qualquer violação destes Termos, incluindo suspensão ou exclusão da conta, retenção de saldo até apuração e encaminhamento dos infratores às autoridades competentes.</p>
          </Item>

          <Item value="i13" title="13. Isenções e limitação de responsabilidade">
            <p>A Plataforma e seus Serviços são fornecidos "COMO ESTÃO" e "CONFORME DISPONÍVEIS". Na máxima extensão permitida pela lei aplicável, a CometaSMS não oferece nenhuma garantia de que os Serviços estarão disponíveis de forma ininterrupta ou livres de erros.</p>
            <p>A CometaSMS não se responsabiliza por:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Recargas realizadas em números incorretos digitados pelo Usuário;</li>
              <li>Ações das operadoras de telefonia (bloqueios, suspensões, portabilidades, falhas de rede);</li>
              <li>Danos indiretos, lucros cessantes ou perdas econômicas decorrentes do uso da Plataforma;</li>
              <li>Indisponibilidades causadas por falhas de gateways de pagamento, parceiros ou força maior.</li>
            </ul>
          </Item>

          <Item value="i14" title="14. eSIM">
            <p><strong>Atenção:</strong> assim que você ativar seu eSIM, <strong>não damos garantia</strong>. A ativação é definitiva e vincula o eSIM ao aparelho (EID) utilizado.</p>
            <p>Trocas só serão avaliadas em casos de erro ou ausência de sinal na primeira ativação, mediante análise. Não há garantia em caso de uso incorreto, QR reaproveitado ou aparelhos previamente utilizados nas operadoras Vivo Controle ou Claro.</p>
          </Item>

          <Item value="i15" title="15. Confidencialidade">
            <p>Você concorda em manter em sigilo qualquer informação não pública obtida através do uso da Plataforma, incluindo detalhes operacionais e técnicas dos Serviços.</p>
          </Item>

          <Item value="i16" title="16. Força maior">
            <p>A CometaSMS não será responsável por qualquer interrupção, atraso ou falha resultante de evento fora de seu controle razoável, incluindo, mas não limitado a, falhas de fornecimento de energia, indisponibilidade de provedores de pagamento, interrupções das operadoras, ataques cibernéticos, guerras, intempéries ou ações governamentais.</p>
          </Item>

          <Item value="i17" title="17. Prazo e rescisão">
            <p>Estes Termos vigoram a partir da aceitação pelo Usuário e permanecem em vigor até serem rescindidos por qualquer das Partes. A CometaSMS pode rescindir os Termos imediatamente em caso de violação, mediante exclusão da conta. O Usuário pode rescindir solicitando o cancelamento da conta a qualquer momento pelo nosso canal de atendimento.</p>
            <p>A inatividade de uma conta por mais de <strong>3 meses consecutivos</strong> autoriza a CometaSMS a encerrá-la, com saldo remanescente sujeito à política de reembolso.</p>
          </Item>

          <Item value="i18" title="18. Disposições gerais">
            <p>Estes Termos representam o acordo integral entre as Partes. Caso qualquer disposição seja considerada inválida, as demais permanecerão em pleno vigor. A omissão da CometaSMS em exercer qualquer direito não constitui renúncia.</p>
          </Item>

          <Item value="i19" title="19. Contato">
            <p>Em caso de dúvidas, reclamações ou solicitações sobre estes Termos, entre em contato com a equipe CometaSMS através dos canais oficiais disponíveis na Plataforma.</p>
            <p className="text-sm text-muted-foreground mt-4">— Equipe CometaSMS</p>
          </Item>

        </Accordion>

        <div className="mt-12 pt-6 border-t border-border flex items-center justify-between">
          <Link to="/register" className="text-sm underline underline-offset-4 hover:text-foreground/70">
            ← Voltar ao cadastro
          </Link>
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
            Já é cadastrado? Entrar
          </Link>
        </div>
      </main>
    </div>
  );
}

function Item({ value, title, children }: { value: string; title: string; children: React.ReactNode }) {
  return (
    <AccordionItem value={value} className="border border-border rounded-xl px-4 bg-card/40">
      <AccordionTrigger className="font-display text-base md:text-lg text-left hover:no-underline">{title}</AccordionTrigger>
      <AccordionContent className="space-y-3 text-ink-soft text-sm leading-relaxed pt-1 pb-4">{children}</AccordionContent>
    </AccordionItem>
  );
}
