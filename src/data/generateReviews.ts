import type { Review } from '../types';

// ─── Pools de dados ────────────────────────────────────────────────────────────

const FIRST_NAMES = [
  'Lucas', 'Ana Clara', 'Rafael', 'Fernanda', 'Breno', 'Juliana', 'Matheus', 'Camila',
  'Gustavo', 'Larissa', 'Diego', 'Mariana', 'Felipe', 'Isabela', 'Thiago', 'Carolina',
  'Bruno', 'Amanda', 'Rodrigo', 'Natalia', 'Pedro', 'Leticia', 'Gabriel', 'Vanessa',
  'Eduardo', 'Priscila', 'Leonardo', 'Beatriz', 'Vinicius', 'Tais', 'Andre', 'Renata',
  'Henrique', 'Patricia', 'Alexandre', 'Monique', 'Caio', 'Aline', 'Murilo', 'Sabrina',
  'Danilo', 'Viviane', 'Fábio', 'Elaine', 'Marcelo', 'Débora', 'Roberto', 'Simone',
  'Carlos', 'Tatiane', 'Ricardo', 'Cristiane', 'Leandro', 'Michele', 'Sérgio', 'Adriana',
  'Renato', 'Luciana', 'Marcos', 'Karina', 'Paulo', 'Sandra', 'Joao', 'Claudia',
];

const LAST_INITIALS = [
  'M.', 'S.', 'T.', 'G.', 'K.', 'O.', 'F.', 'R.', 'B.', 'C.',
  'D.', 'L.', 'P.', 'A.', 'V.', 'N.', 'H.', 'E.', 'W.', 'J.',
  'Z.', 'X.', 'Q.', 'Y.', 'I.', 'U.',
];

const TITLES_5_STARS = [
  'Melhor vape que já usei!',
  'Simplesmente perfeito!',
  'Superou todas as minhas expectativas',
  'Produto top, recomendo demais!',
  'Qualidade incrível, compra garantida',
  'Entrega rápida e produto original',
  'Amei! Já é o terceiro que compro',
  'Sensacional, sabor idêntico ao descrito',
  'Nota 10 sem discussão',
  'Melhor compra que fiz esse ano',
  'Produto excelente, loja confiável',
  'Valeu cada centavo!',
  'Muito bom, voltarei a comprar',
  'Impressionante a qualidade',
  'Top demais, sem palavras!',
  'Fidelizei com essa loja',
  'Produto original, chegou perfeito',
  'Comprei e não me arrependi nem um pouco',
  'Recomendo com os olhos fechados',
  '5 estrelas e pouco ainda!',
];

const TITLES_4_STARS = [
  'Muito bom, quase perfeito',
  'Ótimo custo-benefício',
  'Produto bom, entrega ok',
  'Gostei bastante, recomendo',
  'Bom produto, mas poderia melhorar a embalagem',
  'Satisfeito com a compra',
  'Boa qualidade, vale o preço',
  'Produto como esperado',
  'Comprei e gostei, voltarei',
  'Atendeu minhas expectativas',
];

const TITLES_3_STARS = [
  'Produto ok, nada além disso',
  'Cumpre o prometido',
  'Mediano, mas serve',
  'Esperava um pouco mais',
  'Razoável pelo preço',
];

const COMMENTS_POSITIVE = [
  'Simplesmente incrível! A qualidade é top, o sabor é exatamente como descrito e a durabilidade é muito boa. Já indiquei para vários amigos e todos amaram.',
  'Recebi em 2 dias, embalagem perfeita e o produto é 100% original. O vapor é denso e o sabor dura até o final. Muito satisfeito com a compra!',
  'Comprei pela terceira vez e nunca me decepciona. O sabor é consistente do início ao fim e a qualidade é sempre a mesma. Loja muito confiável!',
  'Estava receoso em comprar online, mas a Vapex Store me surpreendeu! Produto chegou lacrado, original e com sabor incrível. Já sou cliente fiel!',
  'Produto chegou antes do prazo, embalado com cuidado e 100% original. O vapor é espesso e o sabor é idêntico ao descrito. Nota máxima!',
  'Qualidade excepcional! O produto superou as expectativas, com um vapor consistente e sabor que não enjoa. Com certeza vou comprar de novo!',
  'Fiz meu primeiro pedido aqui e não poderia ter sido melhor. Atendimento rápido, produto original e entrega dentro do prazo. Recomendo muito!',
  'Impressionante a qualidade! O vapor é denso, o sabor é marcante e a durabilidade é excelente. Já virei cliente fiel desta loja!',
  'Melhor custo-benefício do mercado! Produto original, entrega rápida e embalagem impecável. Já indiquei para todos os meus amigos!',
  'Produto excelente! O sabor é muito bom e o vapor é denso. Chegou bem embalado e dentro do prazo. Com certeza vou comprar mais!',
  'Superou minhas expectativas! Qualidade premium, sabor delicioso e entrega ultrarrápida. A Vapex Store virou minha loja favorita!',
  'Estou impressionada com a qualidade! O produto é original, o sabor é marcante e a embalagem é perfeita. Recomendo de olhos fechados!',
  'Produto top! O vapor é espesso, o sabor é consistente e a bateria dura bastante. Entrega rápida e atendimento excelente. Nota 10!',
  'Incrível! Comprei porque um amigo indicou e não me arrependi. O sabor é exatamente como descrito e a qualidade é excepcional. Já pedi mais!',
  'Qualidade impecável! O produto chegou dentro do prazo, embalado com cuidado e 100% original. O sabor é muito bom e o vapor denso. Amei!',
  'Fantástico! O sabor é exatamente como esperava, o vapor é denso e consistente do início ao fim. Certamente voltarei a comprar mais vezes.',
  'Produto maravilhoso! Chegou rápido, bem embalado e original. O sabor é delicioso e o vapor é espesso. Já é o meu favorito!',
  'Que produto incrível! O sabor é perfeito, o vapor é muito bom e a duração é excelente. Entrega rápida e sem problemas. Nota 10!',
  'Nunca fui tão satisfeito com uma compra! Produto original, sabor delicioso e entrega relâmpago. A Vapex Store é confiável de verdade!',
  'Muito bom! O sabor é exatamente como descrito, o vapor é denso e a qualidade é excelente. Comprei como presente e a pessoa amou!',
  'Produto de qualidade premium! Chegou rápido, embalagem perfeita e o sabor é incrível. Já encaminhei o link da loja para vários amigos.',
  'Satisfação total! Produto original, entrega rápida e sabor excepcional. O vapor é denso e consistente. Continuarei comprando aqui!',
  'Que surpresa boa! O produto superou minhas expectativas. Sabor delicioso, vapor espesso e qualidade impecável. Já fiz meu segundo pedido!',
  'Excelente! O produto chegou no prazo, está original e o sabor é muito bom. O vapor é consistente e a qualidade é evidente. Nota 10!',
  'Produto fantástico! O sabor é marcante, o vapor é denso e a qualidade é excepcional. Comprei com um pouco de receio mas fui surpreendido!',
  'Amei demais! Comprei baseado nas avaliações e não me decepcionei. O sabor é exatamente como descrito e a qualidade é top. Recomendo!',
  'Muito além do esperado! O produto chegou em perfeito estado, o sabor é incrível e o vapor é espesso. Definitivamente minha loja favorita!',
  'Qualidade excepcional pelo preço! O sabor é delicioso, o vapor é denso e a duração é muito boa. Entrega rápida e atendimento ótimo!',
  'Que produto maravilhoso! Chegou antes do prazo, embalado com cuidado e com sabor incrível. O vapor é espesso e consistente. Top!',
  'Não tenho palavras para descrever o quanto gostei! Produto original, sabor perfeito e entrega ultrarrápida. Já sou fã dessa loja!',
];

const COMMENTS_GOOD = [
  'Muito bom pelo preço! A bateria dura bastante e o sabor é consistente. Tirei uma estrela só porque a embalagem poderia ser melhor, mas o produto é excelente.',
  'Gostei bastante do produto. O sabor é bom e o vapor é razoavelmente denso. Entregou dentro do prazo, sem problemas. Recomendo!',
  'Produto de boa qualidade! O sabor é agradável e a duração é boa. Chegou bem embalado e no prazo. Voltarei a comprar com certeza.',
  'Satisfeito com a compra! O produto é original e o sabor é bom. Poderia ter chegado um pouco antes, mas no geral foi ótimo.',
  'Produto bom! O sabor é como descrito e o vapor é satisfatório. A embalagem chegou um pouco amassada mas o produto estava perfeito.',
  'Custo-benefício excelente! O produto tem boa qualidade e o sabor é agradável. Entrega dentro do prazo e atendimento ok. Recomendo!',
  'Bom produto no geral. O sabor é bom e o vapor é adequado. A loja é confiável e o produto é original. Voltarei a comprar!',
  'Gostei bastante! O produto chegou no prazo e está em perfeitas condições. O sabor é bom e o vapor é satisfatório. Recomendo!',
  'Produto com boa qualidade. O sabor é agradável e a duração é razoável. Embalagem chegou intacta e o produto é original. Ok!',
  'Satisfeito com a compra! O produto é bom e o sabor é como esperado. Entrega rápida e embalagem adequada. Recomendo a loja!',
];

const COMMENTS_NEUTRAL = [
  'Produto ok, cumpre o que promete. Nada de extraordinário, mas é um bom produto pelo preço. Entrega normal, sem surpresas.',
  'Razoável. O sabor é mediano e o vapor é ok. Esperava um pouco mais pela faixa de preço, mas serve para o uso diário.',
  'Produto mediano. Cumpre o prometido mas não supera as expectativas. O sabor é ok e a qualidade é razoável.',
];

// ─── Gerador determinístico (LCG seed baseado no slug) ────────────────────────

function hashSlug(slug: string): number {
  let hash = 5381;
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) + hash) ^ slug.charCodeAt(i);
    hash = hash & 0x7fffffff; // manter positivo 32-bit
  }
  return hash;
}

/** LCG — gera próximo número pseudo-aleatório a partir do seed */
function lcgNext(seed: number): number {
  return (seed * 1664525 + 1013904223) & 0x7fffffff;
}

/** Classe de random determinístico baseado em seed */
class SeededRandom {
  private seed: number;
  constructor(seed: number) { this.seed = seed; }

  next(): number {
    this.seed = lcgNext(this.seed);
    return this.seed / 0x7fffffff;
  }

  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  pickUnique<T>(arr: T[], count: number): T[] {
    const pool = [...arr];
    const result: T[] = [];
    for (let i = 0; i < Math.min(count, pool.length); i++) {
      const idx = Math.floor(this.next() * pool.length);
      result.push(pool.splice(idx, 1)[0]);
    }
    return result;
  }

  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }
}

// ─── Data base para as datas (parece real: últimos 6 meses) ──────────────────

function randomDate(rng: SeededRandom): string {
  const now = new Date('2025-05-01');
  const daysBack = rng.int(1, 180);
  const d = new Date(now.getTime() - daysBack * 86400000);
  return d.toISOString();
}

// ─── Tipo estendido com campos de exibição ───────────────────────────────────

export interface GeneratedReview extends Review {
  author: string;
  verified: boolean;
  helpful: number;
  avatar: string;
}

// ─── Função principal ─────────────────────────────────────────────────────────

/**
 * Gera `count` depoimentos únicos e determinísticos para um dado produto.
 * O mesmo slug sempre produz os mesmos depoimentos — mas slugs diferentes
 * produzem conjuntos completamente distintos.
 */
export function generateReviews(
  productSlug: string,
  productRating: number,
  count: number = 8,
): GeneratedReview[] {
  const rng = new SeededRandom(hashSlug(productSlug));

  // Pares únicos de nome + inicial
  const namePairs = SeededRandom.prototype
    ? (() => {
        const pairs: { first: string; last: string }[] = [];
        const usedNames = new Set<string>();
        let attempts = 0;
        while (pairs.length < count && attempts < 500) {
          attempts++;
          const first = rng.pick(FIRST_NAMES);
          const last = rng.pick(LAST_INITIALS);
          const key = `${first}${last}`;
          if (!usedNames.has(key)) {
            usedNames.add(key);
            pairs.push({ first, last });
          }
        }
        return pairs;
      })()
    : [];

  return namePairs.map(({ first, last }, i) => {
    // Distribui ratings: a maioria bate na nota do produto, com pequena variação
    let rating: number;
    const r = rng.next();
    if (productRating >= 4.8) {
      rating = r < 0.75 ? 5 : r < 0.90 ? 4 : 3;
    } else if (productRating >= 4.5) {
      rating = r < 0.55 ? 5 : r < 0.85 ? 4 : r < 0.95 ? 3 : 2;
    } else {
      rating = r < 0.35 ? 5 : r < 0.65 ? 4 : r < 0.85 ? 3 : r < 0.95 ? 2 : 1;
    }

    const title =
      rating === 5 ? rng.pick(TITLES_5_STARS) :
      rating === 4 ? rng.pick(TITLES_4_STARS) :
      rng.pick(TITLES_3_STARS);

    const comment =
      rating === 5 ? rng.pick(COMMENTS_POSITIVE) :
      rating === 4 ? rng.pick(COMMENTS_GOOD) :
      rng.pick(COMMENTS_NEUTRAL);

    const avatar = `${first[0]}${last[0]}`;
    const helpful = rating >= 4 ? rng.int(3, 48) : rng.int(0, 8);

    return {
      id: `gen-${productSlug}-${i}`,
      product_id: productSlug,
      user_id: '',
      rating,
      title,
      comment,
      created_at: randomDate(rng),
      author: `${first} ${last}`,
      verified: rng.next() > 0.15, // 85% compra verificada
      helpful,
      avatar,
    };
  });
}
