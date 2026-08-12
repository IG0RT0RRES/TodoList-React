/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

import { useEffect, useState, useCallback } from "react";
import Aos from "aos";

// Resources local
import DeleteClip from "../audio/delete.wav";
import ClickClip from "../audio/isDoneTask.ogg";
import Denied from "../audio/denied.wav";
import Popupstyle from "../css/popup.module.css";
import homestylesheet from "../css/home.module.css";
import popupstylesheet from "../css/popup.module.css";

import Tarefa from "../Classes/Tarefa";
import {
  Now,
  Tomorrow,
  DateComparison,
  IsConclued,
  IsExpired,
} from "../Classes/DateOperations";

// Components
import Header from "./Header";
import ContainerList from "./ContainerList";
import NavBar from "./NavBar";
import Footer from "./Footer";
import Layout from "./Layout";
import Popup from "./Popup";

function Home() {
  const [itens, setItens] = useState(() => {
    // Load initial state lazily from LocalStorage
    try {
      const saved = localStorage.getItem("itens");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [dateOptions, setDates] = useState([Now(), Tomorrow()]);
  const [methodFilter, setMethodFilter] = useState(() => (x) => x);
  const [openPopup, setOpenPopup] = useState(
    new Tarefa(
      -1,
      false,
      "Elemento Default",
      Tarefa.GetDateObject(Now()),
      Tarefa.GetDateObject(Now()),
      Tarefa.GetDateObject(Now()),
      Tarefa.GetDateObject(Now()),
      Tarefa.GetDateObject(Now()),
      0
    )
  );

  // Sync state with LocalStorage safely whenever 'itens' changes
  useEffect(() => {
    try {
      localStorage.setItem("itens", JSON.stringify(itens));
    } catch (error) {
      console.error("Failed to sync with LocalStorage:", error);
    }
  }, [itens]);

  // Initialize AOS Library once on mount
  useEffect(() => {
    Aos.init();
  }, []);

  const playAudio = useCallback((clip) => {
    const audio = new Audio(clip);
    audio.volume = 0.1;
    audio.play().catch(() => {}); // Gracefully handle autoplay policies
  }, []);

  const getNewUnusedId = useCallback(() => {
    if (!itens || itens.length === 0) return 0;
    const ids = new Set(itens.map((x) => x.id));
    let id = 0;
    while (ids.has(id)) {
      id++;
    }
    return id;
  }, [itens]);

  const handleAddNewItem = (taskText) => {
    if (DateComparison(dateOptions[0], dateOptions[1]) === 1) {
      playAudio(Denied);
      return alert(
        `A data inicial ${Tarefa.GetDateObject(dateOptions[0]).ToStringShort()} não pode ser maior que a data final ${Tarefa.GetDateObject(dateOptions[1]).ToStringShort()}!`
      );
    }

    if (!taskText || !taskText.trim()) {
      playAudio(Denied);
      return;
    }

    playAudio(ClickClip);
    const newId = getNewUnusedId();
    const newItem = {
      key: newId,
      id: newId,
      tarefa: taskText.trim(),
      state: "unDone",
      date: Tarefa.GetDateObject(Now()),
      modificacao: Tarefa.GetDateObject(Now()),
      expiracao: Tarefa.GetDateObject(dateOptions[1]),
      validade: Tarefa.GetDateObject(dateOptions[0]),
      conclusao: Tarefa.GetDateObject(new Date(1800, 11, 31, 0, 0, 0, 0)),
      qtdeModificacao: 0,
    };

    setItens((prevItens) => [...prevItens, newItem]);
  };

  const handleRemoveItem = (id) => {
    playAudio(DeleteClip);
    setItens((prevItens) => prevItens.filter((x) => x.id !== id));
  };

  const handleUpdateItemStatus = (id, isDone) => {
    setItens((prevItens) =>
      prevItens.map((item) => {
        if (item.id !== id) return item;

        return {
          ...item,
          state: isDone ? "Done" : "unDone",
          conclusao: isDone
            ? Tarefa.GetDateObject(Now())
            : Tarefa.GetDateObject(new Date(1800, 11, 31, 0, 0, 0, 0)),
        };
      })
    );
  };

  const handleDeleteAll = () => {
    playAudio(DeleteClip);
    localStorage.removeItem("itens");
    setItens([]);
  };

  const handleClosePopup = () => {
    setOpenPopup(
      new Tarefa(
        -1,
        false,
        "Default",
        Tarefa.GetDateObject(Now()),
        Tarefa.GetDateObject(Now()),
        Tarefa.GetDateObject(Now()),
        Tarefa.GetDateObject(Now()),
        Tarefa.GetDateObject(Now()),
        0
      )
    );
  };

  const handleOpenPopUpEdit = (objectOld) => {
    if (objectOld) {
      setOpenPopup(objectOld);
    }
  };

  const handleEditItemText = (id, newText) => {
    setItens((prevItens) =>
      prevItens.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          tarefa: newText,
          modificacao: Tarefa.GetDateObject(Now()),
          qtdeModificacao: item.qtdeModificacao + 1,
        };
      })
    );
  };

  const handleCallbackFilter = (filterFunc) => {
    setMethodFilter(() => filterFunc);
  };

  // Compute filtered items dynamically instead of storing duplicates in state
  const filteredItens = methodFilter(itens);

  const optionsObject = [
    {
      Title: "Detalhes",
      Content: (
        <p className={popupstylesheet.pop_up_p}>
          {"Criado em : " +
            Tarefa.GetDateObject(Tarefa.GetDefaultDate(openPopup.Data)).ToString()}
          <br />
          {"Para: " +
            Tarefa.GetDateObject(Tarefa.GetDefaultDate(openPopup.Validade)).ToStringShort()}
          <br />
          {"Expira em: " +
            Tarefa.GetDateObject(Tarefa.GetDefaultDate(openPopup.Expiracao)).ToStringShort()}
          <br />
          {openPopup.QtdeModificacao > 0
            ? "Ultima modificação em: " +
              Tarefa.GetDateObject(Tarefa.GetDefaultDate(openPopup.Modificacao)).ToString()
            : "OBS: Sem modificações."}
          <br />
          {openPopup.QtdeModificacao > 0 && "Qtde: " + openPopup.QtdeModificacao}
          <br />
          {IsConclued(Tarefa.GetDefaultDate(openPopup.Conclusao)) &&
            "Concluído em: " +
              Tarefa.GetDateObject(Tarefa.GetDefaultDate(openPopup.Conclusao)).ToString()}
          <br />
          {IsExpired(
            Tarefa.GetDefaultDate(openPopup.Conclusao),
            Tarefa.GetDefaultDate(openPopup.Expiracao)
          ) &&
            "Expirada em: " +
              Tarefa.GetDateObject(
                Tarefa.GetDefaultDate(openPopup.Expiracao)
              ).ToStringShort()}
          <br />
          {IsExpired(
            Tarefa.GetDefaultDate(openPopup.Conclusao),
            Tarefa.GetDefaultDate(openPopup.Expiracao)
          ) &&
            !IsConclued(Tarefa.GetDefaultDate(openPopup.Conclusao)) &&
            "Tarefa não concluída no prazo."}
        </p>
      ),
    },
  ];

  const elementosPage = [
    <NavBar key="nav" contact="(21) 96544-2847" callbackfilter={handleCallbackFilter} />,
    <Header
      key="header"
      title="ToDo List"
      addnewitem={handleAddNewItem}
      setdateshome={(forDate, expiredDate) => setDates([forDate, expiredDate])}
    />,
    <ContainerList
      key="container"
      itens={filteredItens}
      onremoveitem={handleRemoveItem}
      onuseeffectupdate={handleUpdateItemStatus}
      ondeleteall={handleDeleteAll}
      onopenpopupedit={handleOpenPopUpEdit}
      updatehome={(id) => itens.find((x) => x.id === id)}
    />,
    <Footer key="footer" />,
    <div
      key="popup-wrapper"
      className={
        openPopup.Status
          ? Popupstyle.parent_pop_up
          : Popupstyle.parent_pop_up_event
      }
      id="Popup"
    >
      {openPopup.Status && (
        <Popup
          Item={openPopup}
          options={optionsObject}
          onclosepopup={handleClosePopup}
          onedititemwithpopup={handleEditItemText}
        />
      )}
    </div>,
  ];

  return (
    <div className={homestylesheet.root}>
      <Layout elements={elementosPage} />
    </div>
  );
}

export default Home;