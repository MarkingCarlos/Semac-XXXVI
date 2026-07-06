import './paginaRanking.css';
import paperTexture from '../../assets/PAPER.png';
import podio from "../../assets/ranking/Podio.svg";

export default function Ranking() {
  const vinteMelhores = [
    {
      nome: "TESTE 1 TESTE 1",
      pontos: 100
    },
    {
      nome: "TESTE 2 TESTE 2",
      pontos: 99
    },
    {
      nome: "TESTE 3",
      pontos: 98
    },
    {
      nome: "TESTE 4",
      pontos: 97
    },
    {
      nome: "TESTE 5",
      pontos: 96
    },
    {
      nome: "TESTE 6",
      pontos: 95
    },
    {
      nome: "TESTE 7",
      pontos: 94
    },
    {
      nome: "TESTE 8",
      pontos: 93
    },
    {
      nome: "TESTE 9",
      pontos: 92
    },
    {
      nome: "TESTE 10",
      pontos: 91
    },
    {
      nome: "TESTE 11",
      pontos: 90
    },
    {
      nome: "TESTE 12",
      pontos: 89
    },
    {
      nome: "TESTE 13",
      pontos: 88
    },
    {
      nome: "TESTE 14",
      pontos: 87
    },
    {
      nome: "TESTE 15",
      pontos: 86
    },
    {
      nome: "TESTE 16",
      pontos: 85
    },
    {
      nome: "TESTE 17",
      pontos: 84
    },
    {
      nome: "TESTE 18",
      pontos: 83
    },
    {
      nome: "TESTE 19",
      pontos: 82
    },
    {
      nome: "TESTE 20",
      pontos: 80
    }
  ]



  return (
    <div className="containerRanking"
            style={{
                backgroundImage: `url(${paperTexture})`
            }}>
            <h1>RANKING</h1>
            <div className="containerClassificacao">
              <div className="containerPodio">
                <div className='divPodio'>
                  <p>{vinteMelhores[1].nome} - {vinteMelhores[1].pontos} PTS</p>
                  <div className='elipse2'><h2>2</h2></div>
                  <div className='retan2'></div>
                </div>
                <div className='divPodio'>
                  <p>{vinteMelhores[0].nome} - {vinteMelhores[0].pontos} PTS</p>
                  <div className='elipse1'><h2>1</h2></div>
                  <div className='retan1'></div>
                </div>
                <div className='divPodio'>
                  <p>{vinteMelhores[2].nome} - {vinteMelhores[2].pontos} PTS</p>
                  <div className='elipse3'><h2>3</h2></div>
                  <div className='retan3'></div>
                </div>
              </div>
              <div className="containerPosicoes">
                  {vinteMelhores.map((usuario, index) => {
                    if(index > 2){
                      return(
                      <div className='posicaoUsuario'>
                        <p className='posicao'>{index+1}</p>
                        <p>{usuario.nome}</p>
                        <p>{usuario.pontos} PTS</p>
                      </div>);
                    }
                  })}
              </div>
            </div>
    </div>
  )
}