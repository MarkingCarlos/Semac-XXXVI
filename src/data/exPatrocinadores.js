// ──────────────────────────────────────────────────────────────────────────────
// exPatrocinadores.js — lista de patrocinadores de edições anteriores.
//
// Para adicionar um novo patrocinador:
//   1. Coloque o logo em src/assets/exPatrocinador/
//   2. Importe-o aqui (linha de import)
//   3. Adicione { nome, src } ao array EX_PATROCINADORES
// ──────────────────────────────────────────────────────────────────────────────

import profitor       from '../assets/exPatrocinador/Azul-2x+-+Alessandro+Queiroz.png'
import pca        from '../assets/exPatrocinador/pca_engenharia_de_software_logo.jpg'
import lexisNexis from '../assets/exPatrocinador/LexisNexis_Logo_RGB_Primary_Full-Color_Positive_2025.webp'
import vockan     from '../assets/exPatrocinador/vockan-white.svg'
import jamefy     from '../assets/exPatrocinador/jamefy_cover.jpg'
import shift      from '../assets/exPatrocinador/Shift.png'
import hablla     from '../assets/exPatrocinador/logo-hablla-1080.png'
import icount   from '../assets/exPatrocinador/icount.svg'
import sage_networks   from '../assets/exPatrocinador/LOGO3-4.webp'
import nicBr      from '../assets/exPatrocinador/NIC.br_logo.svg.png'
import visum   from '../assets/exPatrocinador/visum.svg'
import NEOSPACE   from '../assets/exPatrocinador/38236a63c85b2071e544caf83ebb000b8ae318a0.webp'
import sbmac   from '../assets/exPatrocinador/logo-png.png'
import altitudeEscalada   from '../assets/exPatrocinador/escalada.webp'
import arena   from '../assets/exPatrocinador/arena.png'
import ideal   from '../assets/exPatrocinador/ideal.png'
import WZTECH   from '../assets/exPatrocinador/waztec.png'
import alura   from '../assets/exPatrocinador/alura.svg'
import Accurate    from '../assets/exPatrocinador/logo-accurate.svg'
import cengage    from '../assets/exPatrocinador/cengage.png'
import hit   from '../assets/exPatrocinador/hit.png'

export const EX_PATROCINADORES = [
    { nome: 'Profitor',                      src: profitor       },
    { nome: 'PCA Engenharia de Software', src: pca        },
    { nome: 'LexisNexis',                src: lexisNexis },
    { nome: 'Vockan',                    src: vockan     },
    { nome: 'Jamefy',                    src: jamefy     },
    { nome: 'Shift',                     src: shift      },
    { nome: 'Hablla',                    src: hablla     },
    { nome: 'icount plus',               src: icount   },
    { nome: 'sage networks',             src: sage_networks   },
    { nome: 'NIC.br',                    src: nicBr      },
    { nome: 'Visum',                     src: visum   },
    { nome: 'NEOSPACE',                  src: NEOSPACE   },
    { nome: 'sbmac',                     src: sbmac   },
    { nome: 'Altitude escalada',         src: altitudeEscalada   },
    { nome: 'ARENA COPACABANA',          src: arena   },
    { nome: 'Ideal Informática',          src: ideal   },
    { nome: 'WZTECH NETWORKS',          src: WZTECH   },
    { nome: 'Alura',                      src: alura   },
    { nome: 'Accurate software',          src: Accurate    },
    { nome: 'cengage',          src: cengage    },
    // { nome: 'HIT Academia',          src: hit    },
]
