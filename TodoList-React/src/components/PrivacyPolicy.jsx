import React from 'react';

function PrivacyPolicy() {
  const containerStyle = {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '40px 20px',
    fontFamily: 'sans-serif',
    lineHeight: '1.6',
    color: '#FFFFFF'
  };

  const sectionStyle = {
    marginBottom: '30px'
  };

  const titleStyle = {
    color: '#FFFFFF',
    borderBottom: '2px solid #eee',
    paddingBottom: '10px',
    marginBottom: '20px'
  };

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>Política de Privacidade</h1>
      <p>A sua privacidade é importante para nós. Esta política explica como o <strong>TarkHiz Studio</strong> coleta, utiliza e protege suas informações pessoais.</p>

      <section style={sectionStyle}>
        <h2>SEÇÃO 1 - COLETA DE INFORMAÇÕES</h2>
            <p>Quando você realiza alguma transação com nossa loja, como parte do processo de compra e venda,
coletamos as informações pessoais que você nos dá tais como: nome, e-mail e endereço.
Quando você acessa nosso site, também recebemos automaticamente o protocolo de internet do seu
computador, endereço de IP, a fim de obter informações que nos ajudam a aprender sobre seu
navegador e sistema operacional.
</p>
<p>
          <strong>Email Marketing:</strong> O envio de novidades e atualizações sobre nossa loja será realizado apenas com o seu consentimento prévio.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2>SEÇÃO 2 - CONSENTIMENTO</h2>
        <p><strong>Como obtemos seu consentimento?</strong></p>
        <p>
          Entendemos que você concorda com a coleta de dados para fins de execução da compra quando fornece informações para completar uma transação, verificar cartão de crédito, fazer um pedido ou solicitar uma entrega.
        </p>
        <p>
          Caso solicitemos suas informações para fins secundários (como marketing), pediremos seu consentimento explícito ou ofereceremos a oportunidade de recusar.
        </p>
        <p><strong>Como retirar o consentimento?</strong></p>
        <p>
          Você pode mudar de ideia a qualquer momento. Para revogar a autorização de contato ou uso de dados, entre em contato conosco através do e-mail: 
          <a href="mailto:contato.grouptarkhizstudio@gmail.com"> contato.grouptarkhizstudio@gmail.com</a> ou envie uma correspondência para: 
          <em> TarkHiz Studio – Rua José Bonifácio, 201.</em>
        </p>
      </section>

      <section style={sectionStyle}>
        <h2>SEÇÃO 3 - DIVULGAÇÃO</h2>
        <p>
          Podemos divulgar suas informações pessoais caso sejamos obrigados pela lei para fazê-lo ou se
você violar nossos Termos de Serviço.  </p>
      </section>

      <section style={sectionStyle}>
        <h2>SEÇÃO 4 - SERVIÇOS DE TERCEIROS</h2>
        <p>
        No geral, os fornecedores terceirizados usados por nós irão apenas coletar, usar e divulgar suas
informações na medida do necessário para permitir que eles realizem os serviços que eles nos
fornecem.</p>
<p>
Entretanto, certos fornecedores de serviços terceirizados, tais como gateways de pagamento e outros
processadores de transação de pagamento, têm suas próprias políticas de privacidade com respeito à
informação que somos obrigados a fornecer para eles de suas transações relacionadas com compras.
Para esses fornecedores, recomendamos que você leia suas políticas de privacidade para que você
possa entender a maneira na qual suas informações pessoais serão usadas por esses fornecedores.
Em particular, lembre-se que certos fornecedores podem ser localizados em ou possuir instalações
que são localizadas em jurisdições diferentes que você ou nós. Assim, se você quer continuar com
uma transação que envolve os serviços de um fornecedor de serviço terceirizado, então suas
informações podem tornar-se sujeitas às leis da(s) jurisdição(ões) nas quais o fornecedor de serviço
ou suas instalações estão localizados.
Uma vez que você deixe o site da nossa loja ou seja redirecionado para um aplicativo ou site de
terceiros, você não será mais regido por essa Política de Privacidade ou pelos Termos de Serviço do
nosso site.
Links</p>
<p>
Quando você clica em links na nossa loja, eles podem lhe direcionar para fora do nosso site. Não
somos responsáveis pelas práticas de privacidade de outros sites e lhe incentivamos a ler as
declarações de privacidade deles.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2>SEÇÃO 5 - SEGURANÇA</h2>
        <p>
          Para proteger suas informações pessoais, tomamos precauções razoáveis e seguimos as melhores
práticas da indústria para nos certificar que elas não serão perdidas inadequadamente, usurpadas,
acessadas, divulgadas, alteradas ou destruídas.
Se você nos fornecer as suas informações de cartão de crédito, essa informação é criptografada
usando tecnologia "secure socket layer" (SSL) e armazenada com uma criptografia AES-256.
Embora nenhum método de transmissão pela Internet ou armazenamento eletrônico é 100% seguro,
nós seguimos todos os requisitos da PCI-DSS e implementamos padrões adicionais geralmente
aceitos pela indústria.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2>SEÇÃO 6 - ALTERAÇÕES PARA ESSA POLÍTICA DE PRIVACIDADE</h2>
        <p>Reservamos o direito de modificar essa política de privacidade a qualquer momento, então por favor, revise-a com frequência. Alterações e esclarecimentos vão surtir efeito imediatamente após sua publicação no site. Se fizermos alterações de materiais para essa política, iremos notificá-lo aqui que eles foram atualizados, para que você tenha ciência sobre quais informações coletamos, como as usamos, e sob que circunstâncias, se alguma, usamos e/ou divulgamos elas. Se nossa loja for adquirida ou fundida com outra empresa, suas informações podem ser transferidas para os novos proprietários para que possamos continuar a vender produtos para você.</p>
      </section>
    </div>
  );
}

export default PrivacyPolicy;