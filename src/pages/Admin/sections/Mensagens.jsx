import { useState } from 'preact/hooks';
import MensagensAutomaticas from './MensagensAutomaticas.jsx';
import Comunicados from './Comunicados.jsx';
import './mensagens.css';

/* Invólucro da aba "Mensagens" do /admin. Junta duas telas que tratam do
   mesmo assunto — e-mail para participantes — numa entrada só da navbar,
   que já estava cheia.

   As duas continuam sendo componentes independentes, com suas próprias
   chamadas de API: aqui só mora a escolha de qual aparece.

   Padrão é "Automáticas": é a tela de consulta e ajuste do dia a dia. O
   disparo avulso é ação deliberada e irreversível, então não deve ser o
   que abre sozinho quando alguém clica em "Mensagens". */

const SUBABAS = [
    { id: 'automaticas', rotulo: 'Automáticas' },
    { id: 'comunicado', rotulo: 'Comunicado avulso' },
];

export default function Mensagens() {
    const [subabaAtiva, setSubabaAtiva] = useState('automaticas');

    return (
        <div class="containerSecaoComSubabasAdmin">

            <div class="listaSubabasAdmin" role="tablist">
                {SUBABAS.map((subaba) => (
                    <button
                        key={subaba.id}
                        type="button"
                        role="tab"
                        aria-selected={subabaAtiva === subaba.id}
                        class={`botaoSubabaAdmin${subabaAtiva === subaba.id ? ' botaoSubabaAdminAtivo' : ''}`}
                        onClick={() => setSubabaAtiva(subaba.id)}
                    >
                        {subaba.rotulo}
                    </button>
                ))}
            </div>

            {subabaAtiva === 'automaticas' && <MensagensAutomaticas />}
            {subabaAtiva === 'comunicado' && <Comunicados />}
        </div>
    );
}
