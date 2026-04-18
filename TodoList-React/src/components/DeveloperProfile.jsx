import React, { useEffect } from 'react';
import styled from 'styled-components';
import Aos from "aos";
import "aos/dist/aos.css";

// Importando ícones da React Icons (Fa = FontAwesome, Md = Material Design)
import { FaGithub, FaLinkedin, FaEnvelope, FaCode, FaBriefcase, FaUser } from 'react-icons/fa';

// --- Estilos com Styled Components ---
const Container = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 20px;
  background-color: #f9fafb;
  font-family: 'Inter', sans-serif;
  color: #374151;
  overflow-x: hidden; // Evita barras de rolagem durante animações
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 40px;
  padding: 60px 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
`;

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 30px;
  @media (min-width: 768px) { grid-template-columns: 1fr 2fr; }
`;

const Section = styled.section`
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`;

const SectionTitle = styled.h2`
  display: flex;
  align-items: center;
  font-size: 1.25rem;
  margin-bottom: 20px;
  color: #1f2937;
  border-bottom: 2px solid #f3f4f6;
  padding-bottom: 10px;
  svg { margin-right: 10px; color: #2563eb; }
`;

const Card = styled.div`
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 15px;
  transition: transform 0.2s;
  &:hover { transform: translateY(-3px); background-color: #f0f7ff; }
`;

const ContactLink = styled.a`
  display: flex;
  align-items: center;
  text-decoration: none;
  color: #4b5563;
  margin-bottom: 12px;
  &:hover { color: #2563eb; }
  svg { margin-right: 10px; }
`;

const DeveloperProfile = () => {
  // Inicializa a biblioteca de animações
  useEffect(() => {
    Aos.init({ duration: 1000, once: true });
  }, []);

  const devData = {
    nome: "Igor Torres",
    cargo: "Software Developer & Entrepreneur",
    sobre: "Desenvolvedor focado em soluções escaláveis, com experiência em sistemas web, jogos com Unity e gestão de operações digitais.",
    experiencias: [
      { cargo: "Desenvolvedor Full Stack", empresa: "Freelance", periodo: "2023 - Presente" },
      { cargo: "Gestor de Operações", empresa: "Panelinha Delivery", periodo: "2024 - Presente" }
    ],
    projetos: [
      { nome: "Dragonmations App", desc: "Aplicação React integrada com ecossistemas dinâmicos." },
      { nome: "Anti-Cheat System", desc: "Lógica de proteção para jogos em Unity." }
    ],
    contatos: {
      email: "contato@exemplo.com",
      linkedin: "https://linkedin.com",
      github: "https://github.com"
    }
  };

  return (
    <Container>
      <Header data-aos="fade-down">
        <h1 style={{ fontSize: '2.5rem', margin: 0 }}>{devData.nome}</h1>
        <p style={{ color: '#2563eb', fontWeight: 'bold' }}>{devData.cargo}</p>
      </Header>

      <MainGrid>
        {/* Coluna Esquerda */}
        <div data-aos="fade-right">
          <Section>
            <SectionTitle><FaUser /> Sobre Mim</SectionTitle>
            <p style={{ lineHeight: '1.6' }}>{devData.sobre}</p>
          </Section>

          <Section>
            <SectionTitle>Contato</SectionTitle>
            <ContactLink href={`mailto:${devData.contatos.email}`}><FaEnvelope /> Email</ContactLink>
            <ContactLink href={devData.contatos.linkedin}><FaLinkedin /> LinkedIn</ContactLink>
            <ContactLink href={devData.contatos.github}><FaGithub /> GitHub</ContactLink>
          </Section>
        </div>

        {/* Coluna Direita */}
        <div data-aos="fade-left">
          <Section>
            <SectionTitle><FaBriefcase /> Experiência</SectionTitle>
            {devData.experiencias.map((exp, i) => (
              <div key={i} style={{ marginBottom: '20px', borderLeft: '4px solid #2563eb', paddingLeft: '15px' }}>
                <h3 style={{ margin: 0 }}>{exp.cargo}</h3>
                <small style={{ color: '#6b7280' }}>{exp.empresa} | {exp.periodo}</small>
              </div>
            ))}
          </Section>

          <Section>
            <SectionTitle><FaCode /> Projetos</SectionTitle>
            {devData.projetos.map((proj, i) => (
              <Card key={i} data-aos="zoom-in" data-aos-delay={i * 100}>
                <h3 style={{ color: '#1e40af', margin: 0 }}>{proj.nome}</h3>
                <p style={{ fontSize: '0.9rem', marginTop: '5px' }}>{proj.desc}</p>
              </Card>
            ))}
          </Section>
        </div>
      </MainGrid>
    </Container>
  );
};

export default DeveloperProfile;