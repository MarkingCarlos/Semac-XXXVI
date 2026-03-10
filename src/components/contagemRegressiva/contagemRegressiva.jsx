import React, { useState, useEffect} from 'react';
import './contagemRegressiva.css';

const ContagemRegressiva = () => {

    const [dataEvento, setDataEvento] = useState("2026-05-01T12:00:00");
    const [incioContagem, setInicioContagem] = useState(true);
    const [tempoRestante, setTempoRestante] = useState(0);

    useEffect(() => {
        if(incioContagem && dataEvento){
            const intervaloContagem = setInterval(() => {
                const tempoAtual = new Date().getTime();
                const tempoParaEvento = new Date(dataEvento).getTime();
                let tempoRestante = tempoParaEvento - tempoAtual;

                if(tempoRestante <= 0){
                    tempoRestante = 0;
                    clearInterval(intervaloContagem);
                }

                setTempoRestante(tempoRestante);
            }, 1000);

            return () => clearInterval(intervaloContagem);
        }
    }, [incioContagem, dataEvento, tempoRestante]);

    const formatarData = (data) => {
        const opcoes = {
            year: 'numeric',
            month: 'long',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        return new Date(data).toLocaleDateString('pt-BR', opcoes);
    };

    const formatarTempo = (tempo) => {
        const segundos = Math.floor((tempo / 1000) % 60);
        const minutos = Math.floor((tempo / (1000 * 60)) % 60);
        const horas = Math.floor((tempo / (1000 * 60 * 60)) % 24);
        const dias = Math.floor(tempo / (1000 * 60 * 60 * 24));

        return (
            <div className="tempoDiv">
                <div className="tempoContador">
                   <p> {dias.toString().padStart(2,"0")}</p> <span>Dias</span>
                </div>
                <div className="tempoContador">
                    <p>{horas.toString().padStart(2,"0")}</p> <span>Horas</span>
                </div>
                <div className="tempoContador">
                   <p>{minutos.toString().padStart(2,"0")}</p>  <span>Minutos</span>
                </div>
                <div className="tempoContador">
                    <p>{segundos.toString().padStart(2,"0")}</p> <span>Segundos</span>
                </div>
            </div>
        )
    }

    return (
        <div className="contagemRegressiva">
            <h1>Cuidado!!! Devs trabalhando</h1>
            {formatarTempo(tempoRestante)}
        </div>
    );
};


export default ContagemRegressiva;
