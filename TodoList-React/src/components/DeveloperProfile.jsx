import React, { useEffect } from 'react';
import styled from 'styled-components';
import Aos from "aos";
import "aos/dist/aos.css";

// Importando ícones da React Icons
import { FaGithub, FaLinkedin, FaEnvelope, FaCode, FaBriefcase, FaUser } from 'react-icons/fa';

// --- Estilos com Styled Components ---

const Container = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px 20px 40px 20px;
  background-color: #f9fafb;
  font-family: 'Inter', sans-serif;
  color: #374151;
  overflow-x: hidden;
`;

const CoverImage = styled.div`
  width: 100%;
  height: 280px;
  background-image: url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop'); 
  background-size: cover;
  background-position: center;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
`;

const Header = styled.header`
  text-align: center;
  margin: -60px auto 40px auto; // Sobe o header para cima da imagem de capa
  padding: 40px 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
  width: 90%;
  position: relative;
  z-index: 2;
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
  transition: all 0.3s ease;
  &:hover { 
    transform: translateY(-5px); 
    background-color: #f0f7ff;
    box-shadow: 0 5px 15px rgba(37, 99, 235, 0.1);
  }
`;

const ContactLink = styled.a`
  display: flex;
  align-items: center;
  text-decoration: none;
  color: #4b5563;
  margin-bottom: 12px;
  font-weight: 500;
  transition: color 0.2s;
  &:hover { color: #2563eb; }
  svg { margin-right: 10px; font-size: 1.2rem; }
`;

const DeveloperProfile = () => {
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
      { nome: "Anti-Cheat System", desc: "Lógica de proteção para jogos em Unity contra ferramentas de busca visual." },
      { nome: "Panelinha Delivery", desc: "Gestão e otimização de cardápio e branding para plataformas de delivery." },
      { nome: "Unity Game Logic", desc: "Desenvolvimento de mecânicas avançadas e shaders em C#." },
      { nome: "Database Architect", desc: "Estruturação de bancos de dados SQL para sistemas de conquistas e perfis." }
    ],
    contatos: {
      email: "igortorres234@gmail.com",
      linkedin: "https://www.linkedin.com/in/igor-torres-9871a2196/",
      github: "https://github.com/IG0RT0RRES"
    }
  };

  return (
    <Container>
      {/* Imagem de Capa */}
      <CoverImage data-aos="fade-down" />

      {/* Header Flutuante */}
      <Header data-aos="zoom-in" data-aos-delay="200">
        <h1 style={{ fontSize: '2.5rem', margin: 0, color: '#111827' }}>{devData.nome}</h1>
        <p style={{ color: '#2563eb', fontWeight: 'bold', marginTop: '10px', fontSize: '1.1rem' }}>{devData.cargo}</p>
      </Header>

      <MainGrid>
        {/* Coluna Esquerda */}
        <div data-aos="fade-right" data-aos-delay="400">
          <Section>
            <SectionTitle><FaUser /> Sobre Mim</SectionTitle>
            <p style={{ lineHeight: '1.7', color: '#4b5563' }}>{devData.sobre}</p>
          </Section>

          <Section>
            <SectionTitle>Contato</SectionTitle>
            <ContactLink href={`mailto:${devData.contatos.email}`} target="_blank">
              <FaEnvelope /> Email
            </ContactLink>
            <ContactLink href={devData.contatos.linkedin} target="_blank">
              <FaLinkedin /> LinkedIn
            </ContactLink>
            <ContactLink href={devData.contatos.github} target="_blank">
              <FaGithub /> GitHub
            </ContactLink>
          </Section>
        </div>

        {/* Coluna Direita */}
        <div data-aos="fade-left" data-aos-delay="400">
          <Section>
            <SectionTitle><FaBriefcase /> Experiência Profissional</SectionTitle>
            {devData.experiencias.map((exp, i) => (
              <div key={i} style={{ marginBottom: '25px', borderLeft: '4px solid #2563eb', paddingLeft: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{exp.cargo}</h3>
                <p style={{ margin: '5px 0', color: '#6b7280', fontSize: '0.9rem' }}>{exp.empresa} | {exp.periodo}</p>
              </div>
            ))}
          </Section>

          <Section>
            <SectionTitle><FaCode /> Projetos em Destaque</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '15px' }}>
              {devData.projetos.map((proj, i) => (
                <Card key={i} data-aos="fade-up" data-aos-delay={i * 100}>
                  <h3 style={{ color: '#1e40af', margin: 0, fontSize: '1.05rem' }}>{proj.nome}</h3>
                  <p style={{ fontSize: '0.85rem', color: '#4b5563', marginTop: '8px', lineHeight: '1.4' }}>
                    {proj.desc}
                  </p>
                </Card>
              ))}
            </div>
          </Section>
        </div>
      </MainGrid>
    </Container>
  );
};

export default DeveloperProfile;