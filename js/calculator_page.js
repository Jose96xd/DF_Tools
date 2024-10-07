import {get_data, load_dropdown, attack_belongs_to_weapon, updated_form_fields, create_dropdown, create_input_field} from "./web_scripts.js";
import {attack_process_calculation} from "./Weapon_Calculator.js";
import { Creature } from "./Classes/creature.js";
import { Material } from "./Classes/material.js";
import { Weapon } from "./Classes/weapon.js";
import { Attack } from "./Classes/Attack.js";
import { Armor } from "./Classes/Armor.js";

let materials_data = null;
let materials_columns = null;

let weapons_data = null;
let weapons_columns = null;

let attacks_data = null;
let attacks_columns = null;

let races_data = null;
let races_columns = null;

const quality_tuples = [["Basic", 1], ["-Well-crafted-", 1.2], ["+Finely-crafted+", 1.4], ["*Superior*", 1.6], ["≡Exceptional≡", 1.8], ["☼Masterful☼", 2], ["Artifact", 3]]
const am_fields = { "number":["SOLID_DENSITY", "IMPACT_YIELD", "IMPACT_FRACTURE", "IMPACT_STRAIN_AT_YIELD", "SHEAR_YIELD", "SHEAR_FRACTURE", "SHEAR_STRAIN_AT_YIELD"] }

async function initial_load() {

    [races_columns, races_data] = await get_data(".././Data/races_data.csv");
    [weapons_columns, weapons_data] = await get_data(".././Data/weapons_data.csv");
    [attacks_columns, attacks_data] = await get_data(".././Data/attacks_data.csv");
    [materials_columns, materials_data] = await get_data(".././Data/materials_data.csv");

    const race_dropdown = document.getElementById("attacker_race");
    const weapon_dropdown = document.getElementById("weapon_name");
    const attacks_dropdown = document.getElementById("attack_name");
    const wm_dropdown = document.getElementById("weapon_material");
    const offense_characteristics_form = document.getElementById("offense_characteristics");
    const add_armor_layer_button = document.getElementById("add_armor_layer_button");
    const armor_layers_div = document.getElementById("armor_layers");

    const momentum_paragraph = document.getElementById("momentum_paragraph");
    const results_list = document.getElementById("results_list");

    load_dropdown({data:races_data, dropdown:race_dropdown, starting_selected_id:"DWARF"});
    race_dropdown.addEventListener("change", function(){
        updated_form_fields(races_columns, races_data, race_dropdown.value, offense_characteristics_form.elements);
    });

    const aux_function = function (attack_id) { return attack_belongs_to_weapon(weapons_data[weapon_dropdown.value][0], attack_id); }
    load_dropdown({data:weapons_data, dropdown:weapon_dropdown, filling_column:1, starting_selected_id:"ITEM_WEAPON_AXE_BATTLE"});
    weapon_dropdown.addEventListener("change", function(){
        updated_form_fields(weapons_columns, weapons_data, weapon_dropdown.value, offense_characteristics_form.elements);
        load_dropdown({data:attacks_data, dropdown:attacks_dropdown, filling_column:1, load_condition:aux_function});
        updated_form_fields(attacks_columns, attacks_data, attacks_dropdown.value, offense_characteristics_form.elements);
    });
    attacks_dropdown.addEventListener("change", function(){
        updated_form_fields(attacks_columns, attacks_data, attacks_dropdown.value, offense_characteristics_form.elements);
    }); 

    load_dropdown({data:materials_data, dropdown:wm_dropdown, starting_selected_id:"STEEL"});
    wm_dropdown.addEventListener("change", function(){
        updated_form_fields(materials_columns, materials_data, wm_dropdown.value, offense_characteristics_form.elements);
    });

    race_dropdown.dispatchEvent(new Event("change"));
    weapon_dropdown.dispatchEvent(new Event("change"));
    wm_dropdown.dispatchEvent(new Event("change"));

    add_armor_layer_button.addEventListener("click", function(){
        add_armor_layer(armor_layers_div);
    });

    const calculate_button = document.getElementById("calculate_button");
    calculate_button.addEventListener("click", function(){
        execute_calculation(new FormData(offense_characteristics_form), momentum_paragraph, results_list, get_armor_forms(armor_layers_div));
    });
}
function execute_calculation(attack_data, momentum_paragraph, results_list, armor_forms=null){
    results_list.innerHTML = "";
    momentum_paragraph.innerHTML = "";

    const w_material = new Material({
        id:"w_material", solid_density:attack_data.get("wm_SOLID_DENSITY"), impact_yield:attack_data.get("wm_IMPACT_YIELD"),
        shear_yield:attack_data.get("wm_SHEAR_YIELD"), shear_fracture:attack_data.get("wm_SHEAR_FRACTURE"), max_edge:attack_data.get("wm_MAX_EDGE")
    });
    const attack = new Attack({
        id:"attack", contact_area:attack_data.get("attack_contact_area"),
        velocity_modifier:attack_data.get("attack_velocity_modifier"), is_blunt:attack_data.has("blunt_attack")
    });
    const weapon = new Weapon({id:"weapon", size:attack_data.get("w_SIZE"), quality:attack_data.get("weapon_quality"), material:w_material, attacks:[attack]});
    const attacker = new Creature({
        id:"attacker", skill_level:attack_data.get("attacker_skill_lvl"), race_body_size:attack_data.get("BODY_SIZE"),
        creature_body_size:attack_data.get("attacker_BODY_SIZE"), strength:attack_data.get("STRENGTH"), weapon:weapon
    });

    const momentum = attacker.get_momentum(0);
    
    momentum_paragraph.innerHTML = `Attack starts with ${momentum.toFixed(3)} momentum.`;
    
    if (armor_forms.length > 0){
        let layer_momentum = momentum;
        let blunt_attack = (attack.is_blunt);
        for (const [layer_num, armor_layer_form] of armor_forms.entries()){

            //const layer_data = armor_layer.elements;
            const layer_data = new FormData(armor_layer_form);            
            const a_material = new Material({id:"armor_material", solid_density:layer_data.get("am_SOLID_DENSITY"),
                impact_yield:layer_data.get("am_IMPACT_YIELD"), impact_fracture:layer_data.get("am_IMPACT_FRACTURE"), impact_strain_at_yield:layer_data.get("am_IMPACT_STRAIN_AT_YIELD"),
                shear_yield:layer_data.get("am_SHEAR_YIELD"), shear_fracture:layer_data.get("am_SHEAR_FRACTURE"), shear_strain_at_yield:layer_data.get("am_SHEAR_STRAIN_AT_YIELD")
            });
            const armor_layer = new Armor({id:"armor", quality:layer_data.get("armor_quality"), material:a_material, is_rigid:layer_data.has("is_rigid")});
            const attack_history = attack_process_calculation(layer_momentum, attacker, blunt_attack, armor_layer, 0);
            
            const layer_text = document.createElement("li");
            layer_text.innerHTML = get_armor_layer_text_result(attack_history, layer_num);
            results_list.append(layer_text);

            layer_momentum = attack_history["final_momentum"];
            blunt_attack = blunt_attack || attack_history["blunt_forever"];
            
            if(stop_layer_simulation(attack_history)){
                break;
            }
        }
    }
}
function stop_layer_simulation(attack_history){
    const attack_has_bounced = ("bounce_condition" in attack_history) & !attack_history["bounce_condition"];
    const no_more_momentum = (attack_history["final_momentum"] <= (10**-4));
    return attack_has_bounced || no_more_momentum;
}
function get_armor_layer_text_result(attack_history, layer_number){
    const attack_type = attack_history["starts_as_blunt_attack"] ? "Blunt" : "Edge";
    const initial_momentum = attack_history["initial_momentum"]

    let result_text = [`${attack_type} attack hits layer ${layer_number} with ${initial_momentum.toFixed(3)} momentum.`];

    const [passed_cut_condition, cut_condition_value] = [attack_history["passed_cut_condition"], attack_history["cut_condition_value"]];
    if(!attack_history["starts_as_blunt_attack"]){

        const cut_success_text = passed_cut_condition ? ["", "surpassing"]: ["doesn't ", "failing"];
        result_text.push(`Edge attack ${cut_success_text[0]}punctures/severe the layer ${cut_success_text[1]} the cut condition of ${cut_condition_value.toFixed(3)}.`);

        if (!passed_cut_condition)
            result_text.push("Attack becomes blunt for failing.");
    }
    if(attack_history["starts_as_blunt_attack"] || !passed_cut_condition){
        const passed_bounce_condition = attack_history["passed_bounce_condition"];
        result_text.push(passed_bounce_condition ? "Attack doesn't bounce.": "Attack bounces.");

        if (passed_bounce_condition){
            const [passed_smash_condition, smash_condition_value] = [attack_history["passed_smash_condition"], attack_history["smash_condition_value"]];
            const smash_success_text = passed_smash_condition ? ["", "surpassing"]: ["doesn't ", "failing"];
            result_text.push(`Blunt attack ${smash_success_text[0]}punctures/severe the layer ${smash_success_text[1]} the smash condition of ${smash_condition_value.toFixed(3)}.`);
            if ((!passed_smash_condition) & (!attack_history["starts_as_blunt_attack"]))
                result_text.push("Attack becomes blunt forever for failing.");
        }
    }
    if(!("bounce_condition" in attack_history) || (attack_history["bounce_condition"])){
        result_text.push(`Final momentum after hit: ${attack_history["final_momentum"].toFixed(3)}`);
    }
    return result_text.join(" ");
}
function add_armor_layer(armor_layers_div) {
    const id = armor_layers_div.children.length;
    const new_armor_layer = document.createElement("form");
    new_armor_layer.id = "armor_layer_form_" + id;

    const layer_name = document.createElement("p");
    layer_name.innerHTML = "Armor layer " + id;
    new_armor_layer.append(layer_name);

    const [quality_label, quality_dropdown] = create_dropdown("armor_quality", id);
    const [rigid_armor_label, rigid_armor_checkbox] = create_input_field({name:"rigid_armor", id:id, type:"checkbox"});
    rigid_armor_checkbox.checked = true;
    const [am_label, am_dropdown] = create_dropdown("armor_material", id);
    const am_characteristics_div = create_am_characteristics_div(id);

    const delete_button = document.createElement("button");
    delete_button.id = "delete_layer_" + id;
    delete_button.name = "delete_armor_layer"; 
    delete_button.innerHTML = "Delete armor layer"
    delete_button.addEventListener("click", function(){
        updated_forms(armor_layers_div.children, new_armor_layer);    
    });

    new_armor_layer.append(quality_label, quality_dropdown, document.createElement("br"));
    new_armor_layer.append(rigid_armor_label, rigid_armor_checkbox, document.createElement("br"));
    new_armor_layer.append(am_label, am_dropdown, document.createElement("br"));
    new_armor_layer.append(am_characteristics_div, delete_button, document.createElement("br"));

    load_dropdown({data:materials_data, dropdown:am_dropdown, starting_selected_id:"STEEL"});
    load_dropdown({data:quality_tuples, dropdown:quality_dropdown, value_column:1, treatment_function:null});
    am_dropdown.addEventListener("change", function(){
        updated_form_fields(materials_columns, materials_data, am_dropdown.value, new_armor_layer);
    });
    am_dropdown.dispatchEvent(new Event("change"));
    
    armor_layers_div.append(new_armor_layer);
}
function updated_forms(forms, deleted_form){
    const starting_index = Array.from(forms).indexOf(deleted_form);
    deleted_form.remove();
    for(let i = starting_index; i < forms.length; i++){
        forms[i].id = updated_attribute(forms[i].id, i);
        const layer_name = forms[i].getElementsByTagName("p")[0];
        layer_name.innerHTML = "Armor layer " + i;
        
        const child_elements = forms[i].getElementsByTagName("*");
        for(const element of child_elements){
            if(element.hasAttribute("id"))
                element.setAttribute("id", updated_attribute(element.getAttribute("id"), i));
            if(element.hasAttribute("for"))
                element.setAttribute("for", updated_attribute(element.getAttribute("for"), i));
            
        }
    }
}
function updated_attribute(attribute, new_id_number){
    const new_id = attribute.split("_");
    new_id[new_id.length - 1] = new_id_number;
    return new_id.join("_");
}
function get_armor_forms(armor_layers_div){
    const armor_forms = [];
    for(const element of armor_layers_div.children){
        if (element.tagName.toLowerCase() === "form"){
            armor_forms.push(element);
        }
    }
    return armor_forms;
}
function create_am_characteristics_div(id){
    const input_fields = document.createElement("div");
    input_fields.id = "am_layer_characteristics_" + id;
    for (const field_type in am_fields){
        am_fields[field_type].forEach((field) => {
            const [am_label, am_field] = create_input_field({name:"am_"+field, innerText:"Armor Material " + field, id:id, type:field_type, data_column:field});
            input_fields.append(am_label, am_field, document.createElement('br'));
        });
    }
    return input_fields;
}
initial_load()