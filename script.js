const search = document.querySelector('.search');
const random = document.querySelector('.random');
const input = document.querySelector('input');
const cards = document.querySelector('.cards');

function generateRandomNumber(min = 0, max = 10, options = { round: false, place: null }) {
  if (min > max) throw new Error('min cannot be greater than max');

  let randomNum = Math.random() * (max - min) + min;
  const { round, place } = options;

  if (round && typeof place === 'number') {
    if (options.place > 20) throw new Error('Place must be between 0 & 20');
    randomNum = +randomNum.toFixed(options.place);
  }
  return randomNum;
}

function capitalize(str) {
  if (str.length === 0 || typeof str !== 'string') return str;

  return str.slice(0, 1).toUpperCase() + str.slice(1).toLowerCase();

}

function formatWord(str) {
  if (typeof str !== 'string') return str;

  return str.split('-')
    .map(word => capitalize(word))
    .join(' ');
}

function getPokemonAttributes(data) {
  // 4 random moves if more than 4
  const { height, name, weight } = data;
  const hp = data.stats[0].base_stat;
  const atk = data.stats[1].base_stat;
  const def = data.stats[2].base_stat;
  const spatk = data.stats[3].base_stat;
  const spdef = data.stats[4].base_stat;
  const spd = data.stats[5].base_stat;
  const type1 = data.types[0].type.name;
  const image = data.sprites.other['official-artwork'].front_default;
  let type2 = null;
  let ability = null;
  const moves = [];

  // sets type2 if one is available
  if (data.types[1]) type2 = data.types[1].type.name;

  // chooses random ability if multiple are available
  if (data.abilities.length > 1) {
    const max = data.abilities.length - 1;
    const random = generateRandomNumber(0, max, { round: true, place: 0 });
    ability = data.abilities[random].ability.name;
  } else {
    ability = data.abilities[0].ability.name;
  }

  // choose 4 randoms move if we have more than four moves to choose from
  // will not allow duplicate moves
  // else add all the moves
  if (data.moves.length > 4) {

    while (moves.length < 4) {
      const max = data.moves.length - 1;
      const random = generateRandomNumber(0, max, { round: true, place: 0 });
      const move = data.moves[random].move.name;

      if (!moves.includes(move)) moves.push(move);
    }

  } else {
    for (let i = 0; i < data.moves.length; i++) {
      const { move } = data.moves[i];
      moves.push(move.name);
    }
  }

  return {
    height, name, weight, hp, atk, def, spatk, spdef, spd, type1, type2, image, ability, moves
  };
}

function generatePokemonHTML(attributes) {
  const moves = attributes.moves.map(move => {
    return `<div class="pokemon__move">${formatWord(move)}</div>`;
  }).join("");
  const { type1, type2, name, image, ability, hp, atk, def, spdef, spatk, spd, weight, height } = attributes;
  const multiType = `${formatWord(type1)} / ${formatWord(type2)}`;
  const types = !type2 ? formatWord(type1) : multiType;

  const html = `
      <article class="pokemon pokemon__${type1}">
      <div class="pokemon__side pokemon__side--front">
        <header class="pokemon__title">
          <!-- name -->
          <h1 class="pokemon__name">${formatWord(name)}</h1>
          <!-- type -->
          <div class="pokemon__type">${types}</div>
        </header>
        <!-- image -->
        <div class="pokemon__image">
          <img src="${image}" alt="">
        </div>
        <!-- ability -->
        <div class="pokemon__ability">
          Ability - ${formatWord(ability)}
        </div>
        <!-- Main -->
        <div class="pokemon__info">
          <!-- Stats -->
          <div class="pokemon__stats">
            <!-- HP -->
            <div class="pokemon__stat-type">HP</div>
            <div class="pokemon__stat-bar pokemon__stat-bar--hp">${hp}</div>
            <!-- ATT -->
            <div class="pokemon__stat-type">ATK</div>
            <div class="pokemon__stat-bar pokemon__stat-bar--atk">${atk}</div>
            <!-- DEF -->
            <div class="pokemon__stat-type">DEF</div>
            <div class="pokemon__stat-bar pokemon__stat-bar--def">${def}</div>
            <!-- SP. ATK -->
            <div class="pokemon__stat-type">SP. ATK</div>
            <div class="pokemon__stat-bar pokemon__stat-bar--spdef">${spdef}</div>
            <!--SP. DEF -->
            <div class="pokemon__stat-type">SP. DEF</div>
            <div class="pokemon__stat-bar pokemon__stat-bar--spatk">${spatk}</div>
            <!-- SPD -->
            <div class="pokemon__stat-type">SPD</div>
            <div class="pokemon__stat-bar pokemon__stat-bar--spd">${spd}</div>
          </div>
          <!-- Moves -->
          <div class="pokemon__moves">
            ${moves}
          </div>
        </div>
        <!-- Extras -->
        <div class="pokemon__extras">
          <!-- Weight ft -->
          <div class="pokemon__weight">
            Weight - ${weight}
          </div>
          <!-- Height ft -->
          <div class="pokemon__height">
            Height - ${height}
          </div>
        </div>
      </div>
      <div class="pokemon__side pokemon__side--back">
      back
      </div>
    </article>
  `;

  return html;
}

function renderCard(data, root) {
  const attributes = getPokemonAttributes(data);
  const html = generatePokemonHTML(attributes);
  root.innerHTML += html;
}

function searchResponse(chain, arr) {
  for (const key in chain) {

    if (key === 'evolves_to') {

      if (chain[key].length > 0) {
        searchResponse(chain[key][0], arr);
      }

      // console.log([chain.species.name, chain.species.url]);
      arr.unshift([chain.species.name, chain.species.url]);
    }
  }
}

search.addEventListener('click', async () => {


  try {

    const query = input.value.toLowerCase();
    const { data } = await axios.get(`https://pokeapi.co/api/v2/pokemon/${query}`);
    const evolutionSprites = await axios.get(data.species.url)
      .then(async ({ data }) => await axios.get(data.evolution_chain.url))
      .then(({ data }) => {
        const evoLine = [];
        searchResponse(data.chain, evoLine);
        return evoLine;
      })
      .then(async (evoLine) => {
        // console.log(evoLine);
        const requests = evoLine.map(request => axios.get(request[1]));
        const responses = await Promise.all(requests);
        // console.log(responses);
        return responses.map(({ data }) => data);
      })
      .then(async (arrOfData) => {
        // console.log(arrOfData);
        const requests = arrOfData.map(request => axios.get(`https://pokeapi.co/api/v2/pokemon/${request.name}`));
        const responses = await Promise.all(requests);
        // console.log(responses);
        return responses.map(({ data }) => data);
      })
      .then(async (arrOfData) => {
        console.log(arrOfData);
        const sprites = arrOfData.map((data) => data.sprites.other["official-artwork"].front_default);
        return sprites;
      });

    console.log("search: ", search);
    console.log("evolutionSprites: ", evolutionSprites);

    // console.log(data);
    renderCard(data, cards);

  } catch (error) {
    console.log(error);
  }
});

random.addEventListener('click', async () => {
  try {
    // 913 - 1
    const randomId = generateRandomNumber(0, 912, { round: true, place: 0 });
    const responseForPokemon = await axios.get(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
    const responseForEvolution = await axios.get(responseForPokemon.data.species.url);
    const responseForChain = await axios.get(responseForEvolution.data.evolution_chain.url);
    console.log(responseForChain.data);

    // console.log(data);
    // const evoUrl = data.species.url;
    // console.log(evoUrl);
    // const request2 = await axios.get(evoUrl);
    // console.log(request2);
    // // console.log(request2.data.evolution_chain.url);
    renderCard(responseForPokemon.data, cards);
  } catch (error) {
    console.log(error);
  }
});


