export async function get_data_csv(path) {
    const response = await fetch(path);
    const aux = (await response.text()).trim().split("\n");
    const columns = aux[0].trim().split(",");
    const data = aux.slice(1).map((row) => {
        return row.trim().split(",");
    });
    return [columns, data];
}
export async function loadJson(path){
    const response = await fetch(path);
    const json = response.json();
    return json;
}
export function addOptionToDropdown( dropdown, value, text, selected = false) {
    const option = new Option(text, value);
    option.selected = selected;
    dropdown.add(option);
}
export function loadDropdown(ids, texts, dropdown, startingID=null){
    clearDropdown(dropdown);
    for(let i = 0; i < ids.length; i++){
        const id = ids[i];
        const text = texts[i];
        const isSelected = (id === startingID);
        addOptionToDropdown(dropdown, id, text, isSelected);
    }
}
export function load_dropdown({
    data, dropdown, starting_selected_id = null, id_column = 0, filling_column = 0, value_column = null, load_condition = null,
    treatment_function = defaultTextTreatment,
} = {}) {
    clearDropdown(dropdown);
    data.forEach((element, index) => {
        const element_id = element[id_column];
        if (load_condition === null || load_condition(element)) {
            const filling_text =
                treatment_function === null
                    ? element[filling_column]
                    : treatment_function(element[filling_column]);
            const value = value_column === null ? index : element[value_column];
            let selected = dropdown.length < 1;
            if (!(starting_selected_id === null)) {
                selected = starting_selected_id == element_id;
            }
            addOptionToDropdown(dropdown, value, filling_text, selected);
        }
    });
}
export function updateInputField(elementToUpdate, value){
    let newValue = value
    if (elementToUpdate.type === "checkbox"){
        newValue = (newValue === "true");
        if (!(newValue === elementToUpdate.checked)){
            elementToUpdate.click();
        }
    }
    elementToUpdate.value = newValue;
}
export function updateFormFields(formFields, dataObject){
    for (const field of formFields){
        if (field.hasAttribute("data-Field")){
            const fieldData = field.getAttribute("data-Field");
            if (fieldData in dataObject){
                updateInputField(field, dataObject[fieldData]);
            }
        }
    }
}
export function clearDropdown(dropdown) {
    dropdown.innerHTML = null;
}
export function capitalizePhrase(phrase) {
    let capitalize_phrase = phrase.toLowerCase().trim();
    capitalize_phrase =
        capitalize_phrase.charAt(0).toUpperCase() + capitalize_phrase.slice(1);
    return capitalize_phrase;
}
export function defaultTextTreatment(text) {
    return capitalizePhrase(text.trim().replaceAll(/[^a-zA-Z0-9]/gi, " "));
}
export function defaultIdTreatment(text) {
    return text.trim().replaceAll(" ", "_").toUpperCase();
}
export function createDropdown({name, id = null, text = null, treatment_function = defaultTextTreatment} = {}) {
    let id_text = name;

    if (!(id === null)) {
        id_text += id.toString();
    }

    const filling_text = text === null ? treatment_function(name) : text;

    const label = document.createElement("label");
    label.setAttribute("for", id_text);
    label.innerHTML = filling_text;

    const dropdown = document.createElement("select");
    dropdown.name = name;
    dropdown.id = id_text;

    return [label, dropdown];
}
export function createInputField({name, id, type, dataField=null}={}){
    const input_field = document.createElement("input");
    input_field.type = type;
    input_field.id = name + "_" + id;
    input_field.name = name;
    if (!(dataField === null)) {
        input_field.setAttribute("data-Field", dataField);
    }
    return input_field;
}
export function createInputFieldAndLabel({ name, innerText = null, id, type, dataField = null} = {}) {
    const field_id = name + "_" + id;
    const label = document.createElement("label");
    label.setAttribute("for", field_id);
    label.innerHTML = defaultTextTreatment(name);
    if (!(innerText === null)) {
        label.innerHTML = defaultTextTreatment(innerText);
    }
    const inputField = createInputField({name:name, id:id, type:type, dataField:dataField});
    return [label, inputField];
}
export function roundWithoutDecimals(number, precision = 3) {
    const rounded_number = Math.round(number * 10 ** precision) / 10 ** precision;
    return rounded_number;
}
export function isPrimitive(element) {
    return element !== Object(element);
}

export class Table {
    constructor({ id = null, headers = null } = {}) {
        this.table = document.createElement("table");
        this.headers = [];
        this.data = [];

        if (!(id === null)) {
            this.table.id = id;
        }
        if (!(headers === null)) {
            this.headers = headers;
            this.addRow({data:headers, header:true});
        }
    }
    cleanTable() {
        for (let i = this.table.rows.length - 1; i >= 1; i--) {
            this.table.deleteRow(i);
        }
    }
    addRow({data, index = -1, header = false}={}) {
        let row = null;

        if (header) {
            header = this.table.createTHead(index);
            row = header.insertRow(index);
        } else {
            row = this.table.insertRow(index);
        }
        for (const element of data) {
            const cell = row.insertCell();
            if (isPrimitive(element)) {
                cell.innerHTML = element;
            } else {
                cell.appendChild(element);
            }
        }
    }
}
