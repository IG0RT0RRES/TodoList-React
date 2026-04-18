import React, { useEffect, useState } from 'react';

const HardwareInfo = () => {
  const [info, setInfo] = useState({});

  useEffect(() => {
    setInfo({
      ram: navigator.deviceMemory || 'Não disponível',
      cpuCores: navigator.hardwareConcurrency || 'Não disponível',
      plataforma: navigator.platform,
      agente: navigator.userAgent
    });
  }, []);

  return (
    <div>
      <h2 style={{ color:'white'}}>Informações do Hardware</h2>
      <p style={{ color: 'white'}}>Memória RAM: {info.ram} GB</p>
      <p style={{ color: 'white'}}>Núcleos da CPU: {info.cpuCores}</p>
      <p style={{ color: 'white'}}>SO/Plataforma: {info.plataforma}</p>
    </div>
  );
};

export default HardwareInfo;