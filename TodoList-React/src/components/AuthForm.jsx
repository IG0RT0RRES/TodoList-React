import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaUserPlus,
  FaSignInAlt,
  FaCheckCircle,
  FaExclamationCircle
} from 'react-icons/fa';

import ReCAPTCHA from "react-google-recaptcha";
import Aos from 'aos';
import 'aos/dist/aos.css';
import { playfabService } from '../Classes/PlayfabService';

// --- Estilos ---
const AuthContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f3f4f6;
  padding: 20px;
  font-family: 'Inter', sans-serif;
`;

const AuthCard = styled.div`
  background: white;
  width: 100%;
  max-width: 420px;
  padding: 40px;
  border-radius: 24px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
  text-align: center;
  color: #111827;
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  text-align: center;
  color: #6b7280;
  font-size: 0.95rem;
  margin-bottom: 32px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
`;

const InputContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const IconLeft = styled.div`
  position: absolute;
  left: 14px;
  color: #9ca3af;
`;

const StyledInput = styled.input`
  width: 100%;
  padding: 12px 40px 12px 42px;
  border: 1.5px solid ${props => (props.error ? '#ef4444' : '#e5e7eb')};
  border-radius: 12px;
  outline: none;
  &:focus {
    border-color: #2563eb;
  }
`;

const IconButton = styled.button`
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
`;

const ErrorText = styled.span`
  color: #ef4444;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const SubmitButton = styled.button`
  background-color: #2563eb;
  color: white;
  padding: 14px;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #1d4ed8;
  }

  &:disabled {
    background-color: #93c5fd;
    cursor: not-allowed;
  }
`;

const FooterText = styled.p`
  text-align: center;
  margin-top: 24px;
  font-size: 0.9rem;
  color: #4b5563;
  button {
    background: none;
    border: none;
    color: #2563eb;
    font-weight: 700;
    cursor: pointer;
    margin-left: 5px;
    &:hover {
      text-decoration: underline;
    }
  }
`;

// --- Componente Principal ---
const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    Aos.init({ duration: 600 });
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAction = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        // --- Fluxo de Login ---
        const data = await playfabService.login(formData.email, formData.password);
        console.log("Login com sucesso:", data);

        if (window.location.href.includes("uniwebview")) {
          window.location.href = `uniwebview://login-success?ticket=${data.SessionTicket}`;
        } else {
          alert("Bem-vindo ao Quiz of Challenger!");
        }
      } else {
        // --- Fluxo de Cadastro ---
        if (formData.password !== formData.confirmPassword) {
          alert("As senhas não coincidem!");
          setIsLoading(false);
          return;
        }

        await playfabService.register(formData.email, formData.password);
        alert("Conta criada com sucesso! Agora você pode fazer o login.");
        setIsLogin(true);
      }
    } catch (error) {
      alert("Erro: " + (error.errorMessage ));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContainer>
      <AuthCard data-aos="zoom-in">
        <Title>{isLogin ? 'Entrar' : 'Criar Conta'}</Title>
        <Subtitle>
          {isLogin
            ? 'Acesse o portal Quiz of Challenger'
            : 'Cadastre-se para salvar seu progresso'}
        </Subtitle>

        <Form onSubmit={handleAction}>
          <InputWrapper>
            <Label>E-mail</Label>
            <InputContainer>
              <IconLeft><FaEnvelope /></IconLeft>
              <StyledInput
                type="email"
                name="email"
                placeholder="exemplo@email.com"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                required
              />
            </InputContainer>
            {errors.email && (
              <ErrorText><FaExclamationCircle /> {errors.email}</ErrorText>
            )}
          </InputWrapper>

          <InputWrapper>
            <Label>Senha</Label>
            <InputContainer>
              <IconLeft><FaLock /></IconLeft>
              <StyledInput
                type={showPass ? "text" : "password"}
                name="password"
                placeholder="Sua senha"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                required
              />
              <IconButton type="button" onClick={() => setShowPass(!showPass)}>
                {showPass ? <FaEyeSlash /> : <FaEye />}
              </IconButton>
            </InputContainer>
            {errors.password && (
              <ErrorText><FaExclamationCircle /> {errors.password}</ErrorText>
            )}
          </InputWrapper>

          {!isLogin && (
            <InputWrapper data-aos="fade-down">
              <Label>Confirmar Senha</Label>
              <InputContainer>
                <IconLeft><FaCheckCircle /></IconLeft>
                <StyledInput
                  type={showPass ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Repita a senha"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={errors.confirmPassword}
                  required={!isLogin}
                />
              </InputContainer>
              {errors.confirmPassword && (
                <ErrorText>
                  <FaExclamationCircle /> {errors.confirmPassword}
                </ErrorText>
              )}
            </InputWrapper>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
            <ReCAPTCHA
              sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
              onChange={(val) => console.log("Captcha preenchido:", val)}
            />
          </div>

          <SubmitButton type="submit" disabled={isLoading}>
            {isLoading ? (
              "Carregando..."
            ) : (
              isLogin ? (
                <><FaSignInAlt /> Acessar Dashboard</>
              ) : (
                <><FaUserPlus /> Finalizar Cadastro</>
              )
            )}
          </SubmitButton>
        </Form>

        <FooterText>
          {isLogin ? "Não tem uma conta?" : "Já é cadastrado?"}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setErrors({});
            }}
          >
            {isLogin ? "Cadastre-se aqui" : "Faça Login"}
          </button>
        </FooterText>
      </AuthCard>
    </AuthContainer>
  );
};

export default AuthForm;