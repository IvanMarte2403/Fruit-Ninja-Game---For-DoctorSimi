"use client";

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { auth } from "../../../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";

export default function Game() {
  const [selectedGame, setSelectedGame] = useState(null);
  const [currentScore, setCurrentScore] = useState(0); // Score acumulado
  const [iframeVisible, setIframeVisible] = useState(true); // Estado para controlar la visibilidad del iframe
  const [showModal, setShowModal] = useState(true); // Estado para controlar la visibilidad del modal de instrucciones
  const router = useRouter(); // Inicializa useRouter para redireccionar
  const [user, setUser] = useState(null); // Estado para el usuario autenticado

  useEffect(() => {
    const game = localStorage.getItem("selectedGame");
    setSelectedGame(game);

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);

        const userDoc = await getDoc(doc(db, "scores", user.uid));
        if (userDoc.exists() && userDoc.data()[game]) {
          const initialScore = Number(userDoc.data()[game]) || 0;
          setCurrentScore(initialScore);
          console.log("Puntaje inicial desde la base de datos:", initialScore);
        }
      } else {
        router.push('/');
      }
    });

    const handlePostMessage = (event) => {
      console.log("Mensaje recibido:", event.data);

      if (event.data && typeof event.data.number !== 'undefined') {
        if (selectedGame === "juego3") {
          // Para juego 3: Sumar +1 por cada postMessage recibido
          setCurrentScore((prevScore) => {
            const updatedScore = prevScore + 1;
            console.log("Suma de +1 al puntaje actual:", updatedScore);
            return updatedScore;
          });
        } else if (selectedGame === "juego1") {
          // Para juego 1: Sumar el valor recibido y cerrar el iframe
          const scoreValue = Number(event.data.score);
          if (!isNaN(scoreValue)) {
            setCurrentScore((prevScore) => {
              const updatedScore = prevScore + scoreValue;
              console.log("Suma del valor recibido al puntaje actual:", updatedScore);
              setIframeVisible(false); // Cerrar el iframe
              return updatedScore;
            });
          } else {
            console.warn("El valor recibido no es un número válido:", event.data.score);
          }
        }
      }
    };

    window.addEventListener("message", handlePostMessage);

    return () => {
      window.removeEventListener("message", handlePostMessage);
      unsubscribe();
    };
  }, [selectedGame]);

  const handleExit = async () => {
    if (user) {
      try {
        console.log("Puntaje que se sube a la base de datos:", currentScore);
        await setDoc(doc(db, "scores", user.uid), {
          [selectedGame]: currentScore,
        }, { merge: true });
        router.push('/dashboard');
      } catch (error) {
        console.error("Error al guardar el score en Firestore", error);
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const getGameTitle = (game) => {
    switch (game) {
      case "juego1":
        return "Doctor Simi Invade";
      case "juego2":
        return "Doctor Simi Run";
      case "juego3":
        return "Simi Ninja";
      case "juego4":
        return "Simi Space";
      default:
        return "Juego Desconocido";
    }
  };

  const getGameInstructions = (game) => {
    switch (game) {
      case "juego1":
        return "¡No permitas que lleguen al centro! Lanza medicamentos a los virus para eliminarlos. Acumula los puntos que dejan al ser destruidos, para subir los niveles de ataque, defensa y velocidad.";
      case "juego2":
        return "¡No Ganas Hasta Llegar al Zócalo de CDMX!, salta, esquiva y recolecta monedas para llegar al final del nivel. Y obtendrás una medalla de oro";
      case "juego3":
        return "¡No Cortes al Simi! Corta las roscas de reyes lo más rápido posible.";
      case "juego4":
        return "¡Lanzamiento 01/Septiembre/2024! & más sorpresas";
      default:
        return "Instrucciones no disponibles.";
    }
  };

  const getIframeSrc = (game) => {
    switch (game) {
      case "juego1":
        return "games/game-1/public-game/index.html";
      case "juego2":
        return "games/game-2/public/index.html";
      case "juego3":
        return "games/game-3/release/index.html";
      case "juego4":
        return null; // Para el juego 4 no mostramos el iframe
      default:
        return "";
    }
  };

  if (!selectedGame) {
    return <p>Cargando juego...</p>;
  }

  return (
    <main className="container-game">
      <div className="container-interface-game">
        {showModal && (
          <div className="modal">
            <div className="modal-content">
              <h2>Instrucciones</h2>
              <p>{getGameInstructions(selectedGame)}</p>
              <button className="push--flat-blue" onClick={handleCloseModal}>
                <h3>JUGAR</h3>
              </button>
            </div>
          </div>
        )}

        <div className="columna">
          <h3>Points: {currentScore}</h3>
          <img 
            className="medal"
            src="img/medallas/medal-1.svg"
          />
          <button className="push--flat" onClick={handleExit}>
            <h3 className="text-boton">
              Guardar <br />
              y <br />
              Salir
            </h3>
          </button>
        </div>

        <div className="game-center">
          {selectedGame === "juego4" ? (
            <p>Actualizando pronto</p>
          ) : (
            iframeVisible && (
              <iframe src={getIframeSrc(selectedGame)}></iframe>
            )
          )}
        </div>

        <div className="columna">
          <h3>{getGameTitle(selectedGame)}</h3>
          <img 
            className="medal"
            src="img/medallas/medal-3.svg"
          />
          <img 
            className="medal"
            src="img/medallas/medal-4.svg"
          />
        </div> 
      </div>
    </main>
  );
}
