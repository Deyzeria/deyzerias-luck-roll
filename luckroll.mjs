Hooks.once("init", () => {
  registerSettings();
});

function registerSettings() {
  game.settings.register("deyzerias-luck-roll", "higherlower", {
    name: "Higher or Lower",
    hint: "Either rolling below the value counts as a success, or you need to roll above the `dice size - value` meaning that higher roll is a success",
    scope: "world",
    config: true,
    default: "lower",
    type: String,
    choices: {
      lower: "Below the Stat",
      higher: "Above the Stat calculation",
    }
  });

  game.settings.register("deyzerias-luck-roll", "diesize", {
    name: "Die Size",
    hint: "Which Die Size to roll for Checks (amount of die faces, 100 for 1formula00)",
    scope: "world",
    config: true,
    type: Number,
    default: 100
  });
}

Hooks.on("renderActorSheet5eCharacter2", (app, html, data) => {
  // if (!data.editable) return;
  if (data.actor.type != "character") return;
  data.actor.flags.deyzeria ||= {};
  data.actor.flags.deyzeria.luck ||= 0;

  html[0].querySelector(".skills").insertAdjacentHTML("beforebegin", 
  `<filigree-box class="flexrow" style="min-height: 50px; font-family: var(--dnd5e-font-roboto); font-weight: bold; align-items: center; padding: 0.5rem; font-size: 1.4rem;">
    <a id="luckbutton" class="rollable" style="margin-left: 10px; flex: 0 0 90px;" actor-id="${data.actor.id}" luck-stat="${data.actor.flags.deyzeria.luck}"><i class="fa-solid fa-clover"></i> Luck: </a>
    ${data.editable ? `<input name="flags.deyzeria.luck" style="font-weight: bold" type="text" value=${data.actor.flags.deyzeria.luck}>` : `<span>${data.actor.flags.deyzeria.luck}</span>`}
  </filigree-box>`);

  document.getElementById("luckbutton").addEventListener("click", LuckPress);
});

Hooks.on("tidy5e-sheet.renderActorSheet", (app, html, data, force) => {
  if (!data.editable) return;
  if (data.actor.type != "character") return;
  data.actor.flags.deyzeria ||= {};
  data.actor.flags.deyzeria.luck ||= 0;

  html.querySelector(".skills-list-container").insertAdjacentHTML("beforebegin", 
  `<div data-tidy-render-scheme="handlebars" class="flexrow"
  style="font-size: 1.25rem; border: 2px solid var(--t5e-faint-color); border-radius: 3px; font-family: var(--t5e-title-font-family);">
    <button id="luckbutton" type="button" class="transparent-button rollable" style="flex: 0 0 80px; font-size: 1.25rem !important;" title="Luck" actor-id="${data.actor.id}" luck-stat="${data.actor.flags.deyzeria.luck}"><i class="fa-solid fa-clover"></i> Luck: </button>
    <input name="flags.deyzeria.luck" type="text" value=${data.actor.flags.deyzeria.luck}>
  </div?`)

  document.getElementById("luckbutton").addEventListener("click", LuckPress);
});

async function LuckPress() {
  const diesize = game.settings.get("deyzerias-luck-roll", "diesize");
  const formula = new Die({number: 1, faces: diesize});

  if(game.settings.get("deyzerias-luck-roll", "higherlower") == "lower")
  {
    formula.modifiers.push(`cs<=${this.getAttribute("luck-stat")}`);
  }
  else
  {
    formula.modifiers.push(`cs>=${diesize - this.getAttribute("luck-stat")}`);
  }

  const roll = await Roll.fromTerms([formula]).evaluate();
  
  let flavorMessage = 
  `<div style="font-style: normal">
    <h3>Luck Roll</h3>
    <div style="font-weight: bold;">
      Roll Total: ${roll.terms[0].values[0]} | Luck Result: ${roll.total == 1 ? '<span style="color: green">Success</span>' : '<span style="color: red">Failure</span>'}
    </div>
  </div>`;
  let rollMessage = roll.toMessage({speaker: {actor: this.getAttribute("actor-id")}, flavor: flavorMessage});
  await rollMessage;
}