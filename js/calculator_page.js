import {get_data, load_dropdown, attack_belongs_to_weapon, default_text_treatment, updated_form_fields, create_dropdown, create_input_field} from "./web_scripts.js";
import {calculate_momentum} from "./Weapon_Calculator.js";

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

let current_armor_layer_id = 0; // If you read this: Yeah this is probably not a very good way to do this but it will work... for now.

async function initial_load() {

    [races_columns, races_data] = await get_data("/Data/races_data.csv");
    [weapons_columns, weapons_data] = await get_data("/Data/weapons_data.csv");
    [attacks_columns, attacks_data] = await get_data("/Data/attacks_data.csv");
    [materials_columns, materials_data] = await get_data("/Data/materials_data.csv");

    const race_dropdown = document.getElementById("attacker_race");
    const weapon_dropdown = document.getElementById("weapon_name");
    const attacks_dropdown = document.getElementById("attack_name");
    const wm_dropdown = document.getElementById("weapon_material");
    const offense_characteristics_form = document.getElementById("offense_characteristics");
    const add_armor_layer_button = document.getElementById("add_armor_layer_button");
    const armor_layers_div = document.getElementById("armor_layers");

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
        add_armor_layer(armor_layers_div, current_armor_layer_id);
        current_armor_layer_id += 1;
    });

    const calculate_button = document.getElementById("calculate_button");
    calculate_button.addEventListener("click", function(){
        execute_calculation(offense_characteristics_form, get_armor_forms(armor_layers_div));
    });
    
    
}
function execute_calculation(offense_characteristics_form, armor_forms=null){
    const characteristics = offense_characteristics_form.elements;
    
    const momentum = calculate_momentum(characteristics["attacker_skill_lvl"].value,
        characteristics["BODY_SIZE"].value, characteristics["attacker_BODY_SIZE"].value,
        characteristics["STRENGTH"].value, characteristics["attack_velocity_modifier"].value,
        characteristics["w_SIZE"].value, characteristics["wm_SOLID_DENSITY"].value
    );
    console.log(momentum);

    if (armor_forms.length > 0){
        for (const armor_layer of armor_forms){
            console.log(armor_layer);



        }
    }

}
function add_armor_layer(armor_layers_div, id) {
    const new_armor_layer = document.createElement("form");
    new_armor_layer.id = "armor_layer_form_" + id;

    const [quality_label, quality_dropdown] = create_dropdown("armor_quality", id);
    const [rigid_armor_label, rigid_armor_checkbox] = create_input_field("rigid_armor", id, "checkbox"); 
    const [am_label, am_dropdown] = create_dropdown("armor_material", id);
    const am_characteristics_div = create_am_characteristics_div(id);

    const delete_button = document.createElement("button");
    delete_button.id = "delete_layer_" + id;
    delete_button.name = "delete_armor_layer"; 
    delete_button.innerHTML = "Delete armor layer"
    delete_button.addEventListener("click", function(){new_armor_layer.remove();});

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
            const [am_label, am_field] = create_input_field("Armor material "+field, id, field_type, field);
            input_fields.append(am_label, am_field, document.createElement('br'));
        });
    }
    return input_fields;
}
initial_load()