export async function get_data(path) {
    const response = await fetch(path);
    const aux = (await response.text()).trim().split("\n");
    const columns = aux[0].trim().split(",");
    const data = aux.slice(1).map(row => {
        return row.trim().split(",")
    }
    );
    return [columns, data]
}
export function attack_belongs_to_weapon(weapon_id, attack_id) {
    return (weapon_id === attack_id);
}
export function add_option_to_dropdown(dropdown, value, text, selected=false){
    const option = new Option(text, value);
    option.selected = selected;
    dropdown.add(option);
}
export function load_dropdown({data, dropdown, starting_selected_id = null, id_column=0, filling_column = 0, value_column = null, load_condition = null, treatment_function = default_text_treatment} = {}) {
    clear_dropdown(dropdown);
    data.forEach((element, index) => {
        const element_id = element[id_column];
        if (load_condition === null || load_condition(element)) {
            const filling_text = (treatment_function === null) ? element[filling_column] : treatment_function(element[filling_column]);
            const value = (value_column === null) ? index : element[value_column];
            let selected = dropdown.length < 1;
            if (!(starting_selected_id === null)){
                selected = (starting_selected_id == element_id);
            }
            add_option_to_dropdown(dropdown, value, filling_text, selected);
        }
    });
}
export function updated_form_fields(columns, data, data_row_index, elements_to_update){
    for (const element_to_update of elements_to_update){
        if (element_to_update.hasAttribute("data_column") && columns.includes(element_to_update.getAttribute("data_column"))){
            const column = columns.indexOf(element_to_update.getAttribute("data_column"));
            let new_value = data[data_row_index][column];
            if (element_to_update.type == "checkbox"){
                new_value = (new_value === "true");
                if(!(new_value === element_to_update.checked)){
                    element_to_update.click();
                }
            }
            element_to_update.value = new_value;
        }
    }
}
export function clear_dropdown(dropdown) {
    dropdown.innerHTML = null;
}
export function capitalize_phrase(phrase){
    let capitalize_phrase = phrase.toLowerCase().trim();
    capitalize_phrase = capitalize_phrase.charAt(0).toUpperCase() + capitalize_phrase.slice(1);
    return capitalize_phrase;
}
export function default_text_treatment(text) {
    return capitalize_phrase(text.trim().replaceAll(/[^a-zA-Z0-9]/gi, " "));
}
export function default_id_treatment(text){
    return text.trim().replaceAll(" ", "_").toUpperCase();
}
export function create_dropdown(name, id=null, treatment_function = default_text_treatment) {
    const dropdown_id = name + "_" + id.toString();
    const label_element = document.createElement("label");
    label_element.setAttribute("for", dropdown_id);
    label_element.innerHTML = treatment_function(name);
    const dropdown_element = document.createElement("select");
    dropdown_element.name = name;
    dropdown_element.id = dropdown_id;

    return [label_element, dropdown_element]
}
export function create_input_field({name, innerText=null, id, type, data_column=null} = {}) {
    const field_id = name + "_" + id;
    const label = document.createElement("label");
    label.setAttribute("for", field_id);
    label.innerHTML = default_text_treatment(name);
    if (!(innerText === null)){
        label.innerHTML = default_text_treatment(innerText);
    }

    const input_field = document.createElement("input");
    input_field.type = type;
    input_field.id = field_id;
    input_field.name = name;
    if (!(data_column === null)){
        input_field.setAttribute("data_column", data_column);
    }
    return [label, input_field];
}