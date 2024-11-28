import { createDropdown, createInputFieldAndLabel, defaultTextTreatment, loadDropdown, updateFormFields } from "../Web/Web_Scripts.js";
import { calculate_momentum, attackProcessCalculation } from "../DF_Related/Weapon_Calculator.js";
import { Creature } from "../Classes/Creature.js";
import { Weapon } from "../Classes/Weapon.js";
import { Attack } from "../Classes/Attack.js";
import { Material } from "../Classes/Material.js";
import { Armor } from "../Classes/Armor.js";
import { MaterialRepository, RacesRepository, WeaponsRepository } from "../Web/DataRepositore.js";

let materials = null;

const quality_tuples = [["Basic", 1], ["-Well-crafted-", 1.2], ["+Finely-crafted+", 1.4], ["*Superior*", 1.6], ["≡Exceptional≡", 1.8], ["☼Masterful☼", 2], ["Artifact", 3]]
const lm_fields = { "number": ["solid_density", "impact_yield", "impact_fracture", "impact_strain_at_yield", "shear_yield", "shear_fracture", "shear_strain_at_yield"] }

async function initialLoad() {

    const races = new RacesRepository();
    const racesPromise = races.load();
    const weapons = new WeaponsRepository();
    const weaponsPromise = weapons.load();
    materials = new MaterialRepository();
    const materialsPromise = materials.load();

    const raceDropdown = document.getElementById("attacker_race");
    const weaponDropdown = document.getElementById("weapon_name");
    const attacksDropdown = document.getElementById("attack_name");
    const wmDropdown = document.getElementById("weapon_material");
    const offenseCharacteristicsForm = document.getElementById("offense_characteristics");

    const addAmorLayerButton = document.getElementById("add_armor_layer_button");
    const armorLayersDiv = document.getElementById("armor_layers");
    const addBodyLayerButton = document.getElementById("add_body_layer_button");
    const bodyLayersDiv = document.getElementById("body_layers");

    const momentumParagraph = document.getElementById("momentum_paragraph");
    const resultsList = document.getElementById("results_list");

    await racesPromise;
    loadDropdown(races.getAttributes("id"), races.getAttributes("name"), raceDropdown, "DWARF");
    raceDropdown.addEventListener("change", function () {
        const selectedRace = races.getById(raceDropdown.value);
        updateFormFields(offenseCharacteristicsForm.elements, selectedRace);
    });

    await weaponsPromise;
    let currentWeapon = null;
    loadDropdown(weapons.getAttributes("id"), weapons.getAttributes("name"), weaponDropdown, "ITEM_WEAPON_AXE_BATTLE");
    weaponDropdown.addEventListener("change", function () {
        const weapon = weapons.getById(weaponDropdown.value)
        currentWeapon = weapon;
        const attacksId = Array.from({length: weapon.attacks.length}, (_, index) => index);
        const attacksName = weapon.attacks.map(attack => {return attack.name});
        updateFormFields(offenseCharacteristicsForm.elements, weapon);
        loadDropdown(attacksId, attacksName, attacksDropdown);
        updateFormFields(offenseCharacteristicsForm.elements, weapon.attacks[0]);
    });
    attacksDropdown.addEventListener("change", function () {
        updateFormFields(offenseCharacteristicsForm.elements, currentWeapon.attacks[attacksDropdown.value]);
    });

    await materialsPromise;
    loadDropdown(materials.getAttributes("id"), materials.getAttributes("name"), wmDropdown, "STEEL");
    wmDropdown.addEventListener("change", function () {
        const materialAux = materials.getById(wmDropdown.value)
        updateFormFields(offenseCharacteristicsForm.elements, materialAux);
    });

    raceDropdown.dispatchEvent(new Event("change"));
    weaponDropdown.dispatchEvent(new Event("change"));
    wmDropdown.dispatchEvent(new Event("change"));

    addAmorLayerButton.addEventListener("click", function () {
        add_layer(armorLayersDiv);
    });
    addBodyLayerButton.addEventListener("click", function () {
        add_layer(bodyLayersDiv, "body");
    });

    const calculate_button = document.getElementById("calculate_button");
    calculate_button.addEventListener("click", function () {
        executeCalculation(new FormData(offenseCharacteristicsForm), momentumParagraph, resultsList, getLayerForms(armorLayersDiv), getLayerForms(bodyLayersDiv));
    });
}
function executeCalculation(attackData, momentumParagraph, resultsList, armorForms = [], bodyForms = []) {
    resultsList.innerHTML = "";
    momentumParagraph.innerHTML = "";

    const w_material = new Material({
        id: "w_material", solid_density: attackData.get("wm_SOLID_DENSITY"), impact_yield: attackData.get("wm_IMPACT_YIELD"),
        shear_yield: attackData.get("wm_SHEAR_YIELD"), shear_fracture: attackData.get("wm_SHEAR_FRACTURE"), max_edge: attackData.get("wm_MAX_EDGE")
    });
    let bluntAttack = (attackData.has("blunt_attack"));
    const attackType = bluntAttack ? "BLUNT" : "EDGE";
    const attack = new Attack({
        id: "attack", contactArea: attackData.get("attack_contact_area"),
        velocityModifier: attackData.get("attack_velocity_modifier"), type: attackType
    });
    const weapon = new Weapon({ id: "weapon", size: attackData.get("w_SIZE"), quality: attackData.get("weapon_quality"), material: w_material, attacks: [attack] });
    const attacker = new Creature({
        id: "attacker", skillLevel: attackData.get("attacker_skill_lvl"), raceBodySize: attackData.get("BODY_SIZE"),
        bodySize: attackData.get("attacker_BODY_SIZE"), strength: attackData.get("STRENGTH"), weapon: weapon
    });

    const attack_type_multiplier = attackData.get("attack_type");
    const target_is_prone = (attackData.has("prone_state"));
    const material_force_multiplier = attackData.get("material_force_multiplier");

    let momentum = attacker.getMomentum(0);    
    momentum *= attack_type_multiplier;
    momentum *= (target_is_prone ? 2 : 1);

    momentumParagraph.innerHTML = `Attack starts with ${momentum.toFixed(3)} momentum.`;

    const layers_forms = armorForms.concat(bodyForms);
    if (layers_forms.length > 0) {
        let layerMomentum = momentum;
        for (let [layer_num, layer_form] of layers_forms.entries()) {

            let quality = 1
            let layer_type = "armor";
            const layer_data = new FormData(layer_form);

            if (layer_num >= armorForms.length) {
                layer_num -= armorForms.length;
                layer_type = "body";
                if (layer_num === 0) {
                    layerMomentum *= material_force_multiplier;
                }
            } else {
                quality = layer_data.get("armor_quality");
            }

            const a_material = new Material({
                id: "layer_material", solid_density: layer_data.get("lm_solid_density"),
                impact_yield: layer_data.get("lm_impact_yield"), impact_fracture: layer_data.get("lm_impact_fracture"), impact_strain_at_yield: layer_data.get("lm_impact_strain_at_yield"),
                shear_yield: layer_data.get("lm_shear_yield"), shear_fracture: layer_data.get("lm_shear_fracture"), shear_strain_at_yield: layer_data.get("lm_shear_strain_at_yield")
            });
            const armor_layer = new Armor({ id: "layer", quality: quality, material: a_material, is_rigid: layer_data.has("is_rigid") });
            const attack_history = attackProcessCalculation(layerMomentum, attacker, bluntAttack, armor_layer, 0);

            const layer_text = document.createElement("li");
            layer_text.innerHTML = getLayerTextResult(attack_history, layer_num, layer_type);
            resultsList.append(layer_text);

            layerMomentum = attack_history["final_momentum"];
            bluntAttack = bluntAttack || attack_history["blunt_forever"];

            if (stopSimulation(attack_history)) {
                break;
            }
        }
    }
}
function stopSimulation(attack_history) {
    const attack_has_bounced = ("passed_bounce_condition" in attack_history) & !attack_history["passed_bounce_condition"];
    const no_more_momentum = (attack_history["final_momentum"] <= (10 ** -3));
    return attack_has_bounced || no_more_momentum;
}
function getLayerTextResult(attack_history, layer_number, layer_type = "armor") {
    const attack_type = attack_history["starts_as_blunt_attack"] ? "Blunt" : "Edge";
    const initial_momentum = attack_history["initial_momentum"]

    let result_text = [`${attack_type} attack hits ${layer_type} layer ${layer_number} with ${initial_momentum.toFixed(3)} momentum.`];

    const [passed_cut_condition, cut_condition_value] = [attack_history["passed_cut_condition"], attack_history["cut_condition_value"]];
    if (!attack_history["starts_as_blunt_attack"]) {
        result_text = result_text.concat(getEdgeText(passed_cut_condition, cut_condition_value, layer_type));
    }
    if (attack_history["starts_as_blunt_attack"] || !passed_cut_condition) {
        const passed_bounce_condition = attack_history["passed_bounce_condition"];
        result_text.push(passed_bounce_condition ? "Attack doesn't bounce." : "Attack bounces.");

        if (passed_bounce_condition) {
            const [passed_smash_condition, smash_condition_value] = [attack_history["passed_smash_condition"], attack_history["smash_condition_value"]];
            const starts_as_blunt_attack = attack_history["starts_as_blunt_attack"];
            result_text = result_text.concat(getBluntText(starts_as_blunt_attack, passed_smash_condition, smash_condition_value, layer_type));
        }
    }
    if (!("bounce_condition" in attack_history) || (attack_history["bounce_condition"])) {
        result_text.push(`Final momentum after hit: ${attack_history["final_momentum"].toFixed(3)}`);
    }
    return result_text.join(" ");
}
function getEdgeText(passed_cut_condition, cut_condition_value, layer_type = "armor") {
    const result_text = [];
    const cut_success_text = passed_cut_condition ? ["", "surpassing"] : ["doesn't ", "failing"];
    const type_of_damage = (layer_type === "body") ? "punctures/severe" : "penetrates";

    result_text.push(`Edge attack ${cut_success_text[0]}${type_of_damage} the ${layer_type} layer ${cut_success_text[1]} the cut condition of ${cut_condition_value.toFixed(3)}.`);
    if (!passed_cut_condition)
        result_text.push("Attack becomes blunt for failing.");
    return result_text;
}
function getBluntText(starts_as_blunt_attack, passed_smash_condition, smash_condition_value, layer_type = "armor") {
    const result_text = [];
    const smash_success_text = passed_smash_condition ? ["", "surpassing"] : ["doesn't ", "failing"];
    const type_of_damage = (layer_type === "body") ? "punctures/severe" : "penetrates";

    result_text.push(`Blunt attack ${smash_success_text[0]}${type_of_damage} the ${layer_type} layer ${smash_success_text[1]} the smash condition of ${smash_condition_value.toFixed(3)}.`);
    if ((!passed_smash_condition) & (!starts_as_blunt_attack))
        result_text.push("Attack becomes blunt forever for failing.");
    return result_text;
}
function add_layer(layersDiv, layerType = "armor") {
    const layerName = defaultTextTreatment(layerType);

    const idNumber = layersDiv.children.length.toString();
    const id = layerType + idNumber;
    const newLayer = document.createElement("form");
    newLayer.id = layerType + "_layer_form_" + id;

    const layerNameElement = document.createElement("p");
    layerNameElement.innerHTML = layerName + " layer " + idNumber;
    newLayer.append(layerNameElement);

    if (layerType === "armor") {
        const [qualityLabel, qualityDropdown] = createDropdown({ name: "armor_quality", id: id });
        const [rigidArmorLabel, rigidArmorCheckbox] = createInputFieldAndLabel({ name: "rigid_armor", id: id, type: "checkbox" });
        rigidArmorCheckbox.checked = true;
        newLayer.append(qualityLabel, qualityDropdown, document.createElement("br"));
        newLayer.append(rigidArmorLabel, rigidArmorCheckbox, document.createElement("br"));
        loadDropdown(quality_tuples.map(element => {return element[1];}), quality_tuples.map(element => {return element[0];}), qualityDropdown);
    }

    const [lmLabel, lmDropdown] = createDropdown({ name: `${layerType}_layer_material`, id: id });
    const lmCharacteristicsDetails = createLMCharacteristicsDetails(id);

    const deleteButton = document.createElement("button");
    deleteButton.id = `delete_${layerType}_layer_` + id;
    deleteButton.name = `delete_${layerType}_layer_`;
    deleteButton.innerHTML = `Delete ${layerType} layer`;
    deleteButton.addEventListener("click", function () {
        updated_forms(layersDiv.children, newLayer);
    });

    newLayer.append(lmLabel, lmDropdown, document.createElement("br"));
    newLayer.append(lmCharacteristicsDetails, deleteButton, document.createElement("br"));

    const initialMaterialId = (layerType === "armor") ? "STEEL" : "SKIN_TEMPLATE";
    loadDropdown(materials.getAttributes("id"), materials.getAttributes("name"), lmDropdown, initialMaterialId);
    lmDropdown.addEventListener("change", function () {
        updateFormFields(newLayer.elements, materials.getById(lmDropdown.value));
    });
    lmDropdown.dispatchEvent(new Event("change"));
    layersDiv.append(newLayer);
}
function updated_forms(forms, deleted_form) {
    const starting_index = Array.from(forms).indexOf(deleted_form);
    deleted_form.remove();
    for (let i = starting_index; i < forms.length; i++) {
        forms[i].id = updated_attribute(forms[i].id, i);
        const layer_name = forms[i].getElementsByTagName("p")[0];
        layer_name.innerHTML = "Armor layer " + i;

        const child_elements = forms[i].getElementsByTagName("*");
        for (const element of child_elements) {
            if (element.hasAttribute("id"))
                element.setAttribute("id", updated_attribute(element.getAttribute("id"), i));
            if (element.hasAttribute("for"))
                element.setAttribute("for", updated_attribute(element.getAttribute("for"), i));
        }
    }
}
function updated_attribute(attribute, new_id_number) {
    const new_id = attribute.split("_");
    new_id[new_id.length - 1] = new_id_number;
    return new_id.join("_");
}
function getLayerForms(armor_layers_div) {
    const armor_forms = [];
    for (const element of armor_layers_div.children) {
        if (element.tagName.toLowerCase() === "form") {
            armor_forms.push(element);
        }
    }
    return armor_forms;
}
function createLMCharacteristicsDetails(id) {
    const input_fields = document.createElement("details");
    input_fields.id = "lm_characteristics_" + id;
    const summary = document.createElement("summary");
    summary.innerHTML = "Layer details";
    input_fields.append(summary)
    for (const field_type in lm_fields) {
        lm_fields[field_type].forEach((field) => {
            const [lm_label, lm_field] = createInputFieldAndLabel({ name: "lm_" + field, innerText: "Layer material " + field, id: id, type: field_type, dataField: field });
            input_fields.append(lm_label, lm_field, document.createElement('br'));
        });
    }
    return input_fields;
}
initialLoad()