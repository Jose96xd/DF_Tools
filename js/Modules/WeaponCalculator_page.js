import { get_data_csv, load_dropdown, updated_form_fields, create_dropdown, create_input_field_and_label, default_text_treatment } from "../Web/Web_Scripts.js";
import { attack_belongs_to_weapon } from "../DF_Related/DF_Scripts.js";
import { attack_process_calculation } from "../DF_Related/Weapon_Calculator.js";
import { Creature } from "../Classes/Creature.js";
import { Weapon } from "../Classes/Weapon.js";
import { Attack } from "../Classes/Attack.js";
import { Material } from "../Classes/Material.js";
import { Armor } from "../Classes/Armor.js";

let materials_data = null;
let materials_columns = null;

let weapons_data = null;
let weapons_columns = null;

let attacks_data = null;
let attacks_columns = null;

let races_data = null;
let races_columns = null;

const quality_tuples = [["Basic", 1], ["-Well-crafted-", 1.2], ["+Finely-crafted+", 1.4], ["*Superior*", 1.6], ["≡Exceptional≡", 1.8], ["☼Masterful☼", 2], ["Artifact", 3]]
const lm_fields = { "number": ["SOLID_DENSITY", "IMPACT_YIELD", "IMPACT_FRACTURE", "IMPACT_STRAIN_AT_YIELD", "SHEAR_YIELD", "SHEAR_FRACTURE", "SHEAR_STRAIN_AT_YIELD"] }

async function initial_load() {

    [races_columns, races_data] = await get_data_csv("../Data/races_data.csv");
    [weapons_columns, weapons_data] = await get_data_csv("../Data/weapons_data.csv");
    [attacks_columns, attacks_data] = await get_data_csv("../Data/attacks_data.csv");
    [materials_columns, materials_data] = await get_data_csv("../Data/materials_data.csv");

    const race_dropdown = document.getElementById("attacker_race");
    const weapon_dropdown = document.getElementById("weapon_name");
    const attacks_dropdown = document.getElementById("attack_name");
    const wm_dropdown = document.getElementById("weapon_material");
    const offense_characteristics_form = document.getElementById("offense_characteristics");

    const add_armor_layer_button = document.getElementById("add_armor_layer_button");
    const armor_layers_div = document.getElementById("armor_layers");
    const add_body_layer_button = document.getElementById("add_body_layer_button");
    const body_layers_div = document.getElementById("body_layers");

    const momentum_paragraph = document.getElementById("momentum_paragraph");
    const results_list = document.getElementById("results_list");

    load_dropdown({ data: races_data, dropdown: race_dropdown, starting_selected_id: "DWARF" });
    race_dropdown.addEventListener("change", function () {
        updated_form_fields(races_columns, races_data, race_dropdown.value, offense_characteristics_form.elements);
    });

    const aux_function = function (attack) { return attack_belongs_to_weapon(weapons_data[weapon_dropdown.value][0], attack[0]); }
    load_dropdown({ data: weapons_data, dropdown: weapon_dropdown, filling_column: 1, starting_selected_id: "ITEM_WEAPON_AXE_BATTLE" });
    weapon_dropdown.addEventListener("change", function () {
        updated_form_fields(weapons_columns, weapons_data, weapon_dropdown.value, offense_characteristics_form.elements);
        load_dropdown({ data: attacks_data, dropdown: attacks_dropdown, filling_column: 1, load_condition: aux_function });
        updated_form_fields(attacks_columns, attacks_data, attacks_dropdown.value, offense_characteristics_form.elements);
    });
    attacks_dropdown.addEventListener("change", function () {
        updated_form_fields(attacks_columns, attacks_data, attacks_dropdown.value, offense_characteristics_form.elements);
    });

    load_dropdown({ data: materials_data, dropdown: wm_dropdown, starting_selected_id: "STEEL" });
    wm_dropdown.addEventListener("change", function () {
        updated_form_fields(materials_columns, materials_data, wm_dropdown.value, offense_characteristics_form.elements);
    });

    race_dropdown.dispatchEvent(new Event("change"));
    weapon_dropdown.dispatchEvent(new Event("change"));
    wm_dropdown.dispatchEvent(new Event("change"));

    add_armor_layer_button.addEventListener("click", function () {
        add_layer(armor_layers_div);
    });
    add_body_layer_button.addEventListener("click", function () {
        add_layer(body_layers_div, "body");
    });

    const calculate_button = document.getElementById("calculate_button");
    calculate_button.addEventListener("click", function () {
        execute_calculation(new FormData(offense_characteristics_form), momentum_paragraph, results_list, get_layer_forms(armor_layers_div), get_layer_forms(body_layers_div));
    });
}
function execute_calculation(attack_data, momentum_paragraph, results_list, armor_forms = [], body_forms = []) {
    results_list.innerHTML = "";
    momentum_paragraph.innerHTML = "";
    
    const w_material = new Material({
        id: "w_material", solid_density: attack_data.get("wm_SOLID_DENSITY"), impact_yield: attack_data.get("wm_IMPACT_YIELD"),
        shear_yield: attack_data.get("wm_SHEAR_YIELD"), shear_fracture: attack_data.get("wm_SHEAR_FRACTURE"), max_edge: attack_data.get("wm_MAX_EDGE")
    });
    const attack = new Attack({
        id: "attack", contact_area: attack_data.get("attack_contact_area"),
        velocity_modifier: attack_data.get("attack_velocity_modifier"), is_blunt: attack_data.has("blunt_attack")
    });
    const weapon = new Weapon({ id: "weapon", size: attack_data.get("w_SIZE"), quality: attack_data.get("weapon_quality"), material: w_material, attacks: [attack] });
    const attacker = new Creature({
        id: "attacker", skill_level: attack_data.get("attacker_skill_lvl"), race_body_size: attack_data.get("BODY_SIZE"),
        creature_body_size: attack_data.get("attacker_BODY_SIZE"), strength: attack_data.get("STRENGTH"), weapon: weapon
    });

    const attack_type_multiplier = attack_data.get("attack_type");
    const target_is_prone = (attack_data.has("prone_state"));
    const material_force_multiplier = attack_data.get("material_force_multiplier");

    let momentum = attacker.get_momentum(0);
    momentum *= attack_type_multiplier;
    momentum *= (target_is_prone ? 2 : 1);

    momentum_paragraph.innerHTML = `Attack starts with ${momentum.toFixed(3)} momentum.`;

    const layers_forms = armor_forms.concat(body_forms);
    if (layers_forms.length > 0) {
        let layer_momentum = momentum;
        let blunt_attack = (attack.is_blunt);
        for (let [layer_num, layer_form] of layers_forms.entries()) {

            let quality = 1
            let layer_type = "armor";
            const layer_data = new FormData(layer_form);

            if (layer_num >= armor_forms.length){
                layer_num -= armor_forms.length;
                layer_type = "body";
                if (layer_num === 0){
                    layer_momentum *= material_force_multiplier;
                }
            }else{
                quality = layer_data.get("armor_quality");
            }

            const a_material = new Material({
                id: "layer_material", solid_density: layer_data.get("lm_SOLID_DENSITY"),
                impact_yield: layer_data.get("lm_IMPACT_YIELD"), impact_fracture: layer_data.get("lm_IMPACT_FRACTURE"), impact_strain_at_yield: layer_data.get("lm_IMPACT_STRAIN_AT_YIELD"),
                shear_yield: layer_data.get("lm_SHEAR_YIELD"), shear_fracture: layer_data.get("lm_SHEAR_FRACTURE"), shear_strain_at_yield: layer_data.get("lm_SHEAR_STRAIN_AT_YIELD")
            });
            const armor_layer = new Armor({ id: "layer", quality: quality, material: a_material, is_rigid: layer_data.has("is_rigid") });
            const attack_history = attack_process_calculation(layer_momentum, attacker, blunt_attack, armor_layer, 0);

            const layer_text = document.createElement("li");
            layer_text.innerHTML = get_layer_text_result(attack_history, layer_num, layer_type);
            results_list.append(layer_text);

            layer_momentum = attack_history["final_momentum"];
            blunt_attack = blunt_attack || attack_history["blunt_forever"];

            if (stop_layer_simulation(attack_history)) {
                break;
            }
        }
    }
}
function stop_layer_simulation(attack_history) {
    const attack_has_bounced = ("passed_bounce_condition" in attack_history) & !attack_history["passed_bounce_condition"];
    const no_more_momentum = (attack_history["final_momentum"] <= (10 ** -3));
    return attack_has_bounced || no_more_momentum;
}
function get_layer_text_result(attack_history, layer_number, layer_type = "armor") {
    const attack_type = attack_history["starts_as_blunt_attack"] ? "Blunt" : "Edge";
    const initial_momentum = attack_history["initial_momentum"]

    let result_text = [`${attack_type} attack hits ${layer_type} layer ${layer_number} with ${initial_momentum.toFixed(3)} momentum.`];

    const [passed_cut_condition, cut_condition_value] = [attack_history["passed_cut_condition"], attack_history["cut_condition_value"]];
    if (!attack_history["starts_as_blunt_attack"]) {
        result_text = result_text.concat(get_edge_text(passed_cut_condition, cut_condition_value, layer_type));
    }
    if (attack_history["starts_as_blunt_attack"] || !passed_cut_condition) {
        const passed_bounce_condition = attack_history["passed_bounce_condition"];
        result_text.push(passed_bounce_condition ? "Attack doesn't bounce." : "Attack bounces.");

        if (passed_bounce_condition) {
            const [passed_smash_condition, smash_condition_value] = [attack_history["passed_smash_condition"], attack_history["smash_condition_value"]];
            const starts_as_blunt_attack = attack_history["starts_as_blunt_attack"];
            result_text = result_text.concat(get_blunt_text(starts_as_blunt_attack, passed_smash_condition, smash_condition_value, layer_type));
        }
    }
    if (!("bounce_condition" in attack_history) || (attack_history["bounce_condition"])) {
        result_text.push(`Final momentum after hit: ${attack_history["final_momentum"].toFixed(3)}`);
    }
    return result_text.join(" ");
}
function get_edge_text(passed_cut_condition, cut_condition_value, layer_type = "armor") {
    const result_text = [];
    const cut_success_text = passed_cut_condition ? ["", "surpassing"] : ["doesn't ", "failing"];
    const type_of_damage = (layer_type === "body") ? "punctures/severe" : "penetrates";

    result_text.push(`Edge attack ${cut_success_text[0]}${type_of_damage} the ${layer_type} layer ${cut_success_text[1]} the cut condition of ${cut_condition_value.toFixed(3)}.`);
    if (!passed_cut_condition)
        result_text.push("Attack becomes blunt for failing.");
    return result_text;
}
function get_blunt_text(starts_as_blunt_attack, passed_smash_condition, smash_condition_value, layer_type = "armor") {
    const result_text = [];
    const smash_success_text = passed_smash_condition ? ["", "surpassing"] : ["doesn't ", "failing"];
    const type_of_damage = (layer_type === "body") ? "punctures/severe" : "penetrates";

    result_text.push(`Blunt attack ${smash_success_text[0]}${type_of_damage} the ${layer_type} layer ${smash_success_text[1]} the smash condition of ${smash_condition_value.toFixed(3)}.`);
    if ((!passed_smash_condition) & (!starts_as_blunt_attack))
        result_text.push("Attack becomes blunt forever for failing.");
    return result_text;
}
function add_layer(layers_div, layer_type = "armor") {
    const layer_name = default_text_treatment(layer_type);

    const id_number = layers_div.children.length.toString();
    const id = layer_type + id_number;
    const new_layer = document.createElement("form");
    new_layer.id = layer_type + "_layer_form_" + id;

    const layer_name_element = document.createElement("p");
    layer_name_element.innerHTML = layer_name + " layer " + id_number;
    new_layer.append(layer_name_element);

    if (layer_type === "armor") {
        const [quality_label, quality_dropdown] = create_dropdown({ name: "armor_quality", id: id });
        const [rigid_armor_label, rigid_armor_checkbox] = create_input_field_and_label({ name: "rigid_armor", id: id, type: "checkbox" });
        rigid_armor_checkbox.checked = true;
        new_layer.append(quality_label, quality_dropdown, document.createElement("br"));
        new_layer.append(rigid_armor_label, rigid_armor_checkbox, document.createElement("br"));
        load_dropdown({ data: quality_tuples, dropdown: quality_dropdown, value_column: 1, treatment_function: null });
    }

    const [lm_label, lm_dropdown] = create_dropdown({ name: `${layer_type}_layer_material`, id: id });
    const lm_characteristics_details = create_lm_characteristics_details(id);

    const delete_button = document.createElement("button");
    delete_button.id = `delete_${layer_type}_layer_` + id;
    delete_button.name = `delete_${layer_type}_layer_`;
    delete_button.innerHTML = `Delete ${layer_type} layer`;
    delete_button.addEventListener("click", function () {
        updated_forms(layers_div.children, new_layer);
    });

    new_layer.append(lm_label, lm_dropdown, document.createElement("br"));
    new_layer.append(lm_characteristics_details, delete_button, document.createElement("br"));


    const initial_material = (layer_type === "armor") ? "STEEL" : "SKIN";
    load_dropdown({ data: materials_data, dropdown: lm_dropdown, starting_selected_id: initial_material });
    lm_dropdown.addEventListener("change", function () {
        updated_form_fields(materials_columns, materials_data, lm_dropdown.value, new_layer);
    });
    lm_dropdown.dispatchEvent(new Event("change"));

    layers_div.append(new_layer);
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
function get_layer_forms(armor_layers_div) {
    const armor_forms = [];
    for (const element of armor_layers_div.children) {
        if (element.tagName.toLowerCase() === "form") {
            armor_forms.push(element);
        }
    }
    return armor_forms;
}
function create_lm_characteristics_div(id) {
    const input_fields = document.createElement("div");
    input_fields.id = "lm_characteristics_" + id;
    for (const field_type in lm_fields) {
        lm_fields[field_type].forEach((field) => {
            const [lm_label, lm_field] = create_input_field_and_label({ name: "lm_" + field, innerText: "Layer material " + field, id: id, type: field_type, data_column: field });
            input_fields.append(lm_label, lm_field, document.createElement('br'));
        });
    }
    return input_fields;
}
function create_lm_characteristics_details(id){
    const input_fields = document.createElement("details");
    input_fields.id = "lm_characteristics_" + id;
    const summary = document.createElement("summary");
    summary.innerHTML = "Layer details";
    input_fields.append(summary)
    for (const field_type in lm_fields) {
        lm_fields[field_type].forEach((field) => {
            const [lm_label, lm_field] = create_input_field_and_label({ name: "lm_" + field, innerText: "Layer material " + field, id: id, type: field_type, data_column: field });
            input_fields.append(lm_label, lm_field, document.createElement('br'));
        });
    }
    return input_fields;
}
initial_load()