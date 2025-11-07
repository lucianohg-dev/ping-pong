import React, { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import { motion } from "framer-motion";
import "./Scoreboard.css";

// 🔹 Configuração Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDFgwMiN87HirsXuGvq0zvcLitQDfYd1oI",
  authDomain: "score-ping-pong.firebaseapp.com",
  projectId: "score-ping-pong",
  storageBucket: "score-ping-pong.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcd1234",
};

// 🔹 Inicialização Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// 🔹 Lista global de jogadores
const GLOBAL_PLAYERS_LIST = [
  "Luciano App", "Dayvi", "Welton", "Marcos",
  "Gabriel", "Guilherme", "Iranildo", "Rodrigo",
  "Wagner", "Davi", "Calebe", "Lucas",
  "Jonathan", "Silvan", "Lucas Promotor", "Junior",
  "Gordão", "Gildo", "Alisson", "Allan",
];

export default function Scoreboard() {
  const [manualPlayerNames, setManualPlayerNames] = useState(Array(16).fill(""));
  const [stages, setStages] = useState({});
  const [champion, setChampion] = useState(null);

  // 🔒 Controle de senha de administrador
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const ADMIN_PASSWORD = "pingpong2025@";

  // 🔹 Autenticação Anônima
  useEffect(() => {
    async function authFirebase() {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Erro de autenticação:", error);
      }
    }
    authFirebase();
  }, []);

  // 🔹 Listener Firestore
  useEffect(() => {
    const docRef = doc(db, "scoreboard", "pingpongcup");
    const unsub = onSnapshot(docRef, (snap) => {
      const data = snap.data();
      if (data) {
        setStages(data.stages || {});
        setChampion(data.champion || null);
        if (data.players && Array.isArray(data.players)) {
          setManualPlayerNames(data.players);
        }
      }
    });
    return () => unsub();
  }, []);

  // ---------- Gerar Oitavas ----------
  const generateKnockoutStage = async () => {
    const players = manualPlayerNames.filter((n) => n.trim() !== "");
    if (players.length !== 16) return alert("Escolha os 16 jogadores!");

    const matches = [];
    for (let i = 0; i < 8; i++) {
      matches.push({
        id: i,
        player1: players[i],
        player2: players[15 - i],
        winner: "",
      });
    }

    await setDoc(doc(db, "scoreboard", "pingpongcup"), {
      stages: { oitavas: matches },
      players: manualPlayerNames,
    });
  };

  // ---------- Salvar jogadores ----------
  const savePlayersToFirebase = async () => {
    const ref = doc(db, "scoreboard", "pingpongcup");
    await updateDoc(ref, { players: manualPlayerNames });
    alert("Jogadores atualizados no banco de dados!");
  };

  // ---------- Próxima fase automática ----------
  const nextStage = async (name, winners) => {
    const matches = [];
    for (let i = 0; i < winners.length; i += 2) {
      matches.push({
        id: i / 2,
        player1: winners[i],
        player2: winners[i + 1],
        winner: "",
      });
    }
    const ref = doc(db, "scoreboard", "pingpongcup");
    const snap = await getDoc(ref);
    const data = snap.data();
    await setDoc(
      ref,
      { stages: { ...data.stages, [name]: matches }, players: manualPlayerNames },
      { merge: true }
    );
  };

  // ---------- Escolher vencedor ----------
  const setWinner = async (stageName, matchId, winner) => {
    const ref = doc(db, "scoreboard", "pingpongcup");
    const snap = await getDoc(ref);
    const data = snap.data();
    const updatedStages = { ...data.stages };
    const match = updatedStages[stageName].find((m) => m.id === matchId);
    match.winner = winner;
    await setDoc(ref, { stages: updatedStages }, { merge: true });

    const winners = updatedStages[stageName]
      .filter((m) => m.winner)
      .map((m) => m.winner);

    if (stageName === "oitavas" && winners.length === 8)
      await nextStage("quartas", winners);
    if (stageName === "quartas" && winners.length === 4)
      await nextStage("semifinal", winners);
    if (stageName === "semifinal" && winners.length === 2)
      await nextStage("final", winners);
    if (stageName === "final" && winners.length === 1)
      await setDoc(
        ref,
        { stages: updatedStages, champion: winners[0] },
        { merge: true }
      );
  };

  // ---------- Limpar tudo ----------
  const clearAll = async () => {
    if (!isAuthorized) return alert("Somente administrador pode limpar tudo.");
    const confirm = window.confirm("Tem certeza que deseja apagar tudo e começar do zero?");
    if (!confirm) return;

    const ref = doc(db, "scoreboard", "pingpongcup");
    await setDoc(ref, { stages: {}, champion: null, players: Array(16).fill("") });
    setManualPlayerNames(Array(16).fill(""));
    setStages({});
    setChampion(null);
    alert("Tudo foi limpo! Comece novamente.");
  };

  // 🔒 Login admin
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthorized(true);
      setPasswordInput("");
    } else {
      alert("Senha incorreta!");
    }
  };

  // 🔓 Logout
  const handleLogout = () => {
    const confirmLogout = window.confirm("Deseja realmente sair do modo administrador?");
    if (confirmLogout) {
      setIsAuthorized(false);
      setPasswordInput("");
    }
  };

  const stageOrder = ["oitavas", "quartas", "semifinal", "final"];

  return (
    <div className="arena-container" style={{ position: "relative" }}>
      {/* 🔒 Tela de bloqueio */}
      {!isAuthorized && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0, 0, 0, 0.85)",
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <h2>🔐 Acesso restrito ao administrador</h2>
          <form
            onSubmit={handlePasswordSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <input
              type="password"
              placeholder="Digite a senha"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              style={{
                padding: "10px",
                borderRadius: "8px",
                border: "none",
                fontSize: "16px",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                background: "#ffcc00",
                border: "none",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Entrar
            </button>
          </form>
        </div>
      )}

      {/* 🔘 Botão de Logout */}
      {isAuthorized && (
        <button
          onClick={handleLogout}
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            background: "#ff4444",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "8px 14px",
            cursor: "pointer",
            fontWeight: "bold",
            zIndex: 1000,
          }}
        >
          🚪 Sair
        </button>
      )}

      <motion.h1
        className="title"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        🏓 Torneio de Ping-Pong 🏆
      </motion.h1>

      {/* Seleção dos jogadores */}
      <div className="player-entry">
        <h2>Selecione os 16 competidores</h2>
        <div className="player-grid">
          {manualPlayerNames.map((name, i) => (
            <select
              key={i}
              value={name}
              disabled={!isAuthorized}
              onChange={(e) => {
                const selected = e.target.value;
                if (manualPlayerNames.includes(selected)) {
                  alert(`O jogador ${selected} já foi escolhido!`);
                  return;
                }
                const newNames = [...manualPlayerNames];
                newNames[i] = selected;
                setManualPlayerNames(newNames);
              }}
            >
              <option value="">Jogador {i + 1}</option>
              {GLOBAL_PLAYERS_LIST.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          ))}
        </div>

        <div className="player-actions">
          {isAuthorized && (
            <>
              <button className="btn-save" onClick={savePlayersToFirebase}>
                💾 Salvar Jogadores
              </button>
              <button className="btn-clear" onClick={clearAll}>
                🧹 Limpar Tudo
              </button>
            </>
          )}
          <button className="btn-generate" onClick={generateKnockoutStage}>
            Iniciar Oitavas de Final
          </button>
        </div>
      </div>

      {/* Chave visual */}
      <div className="tournament-bracket">
        {stageOrder.map(
          (stage) =>
            stages[stage] && (
              <div key={stage} className="bracket-column">
                <h3>{stage.toUpperCase()}</h3>
                {stages[stage].map((match) => (
                  <motion.div
                    key={match.id}
                    className="match-card"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <button
                      className={match.winner === match.player1 ? "winner" : ""}
                      onClick={() =>
                        isAuthorized && setWinner(stage, match.id, match.player1)
                      }
                    >
                      🏓 {match.player1}
                    </button>
                    <span className="vs">vs</span>
                    <button
                      className={match.winner === match.player2 ? "winner" : ""}
                      onClick={() =>
                        isAuthorized && setWinner(stage, match.id, match.player2)
                      }
                    >
                      {match.player2} 🏓
                    </button>
                  </motion.div>
                ))}
              </div>
            )
        )}
      </div>

      {champion && (
        <motion.div
          className="champion-banner"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          🏆 {champion.toUpperCase()} É O CAMPEÃO MUNDIAL! 🏆
        </motion.div>
      )}
    </div>
  );
}
