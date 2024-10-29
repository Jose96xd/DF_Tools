import { get_data_csv, load_dropdown, default_id_treatment, create_dropdown, default_text_treatment, updateInputField, Table, round_without_decimals} from "../Web/Web_Scripts.js";
import { search_element_by_id, armor_is_of_type } from "../DF_Related/DF_Scripts.js";
import { Armor } from "../Classes/Armor.js";

// Hardcoded values until i finish the scraping
const RELATIVE_SIZES = Object.freeze({
    "HELM": 3786 / 70000,
    "UPPER_BODY": 12621 / 70000,
    "HANDS": 1009 / 70000,
    "LOWER_BODY": 12621 / 70000,
    "FEET": 1514 / 70000
});

let armor_columns = null;
let armor_data = null;

let races_columns = null;
let races_data = null;

const armor_table_columns = Object.freeze(["Name", "Layer", "Coverage", "Layer size", "Layer permit", "Total layers size", "Shaped?",  "Valid?", "Physical volume of the layers", "Delete"]);
const sorted_layers = Object.freeze(["UNDER", "OVER", "ARMOR", "COVER"]);

async function initial_load() {

    [armor_columns, armor_data] = await get_data_csv("../Data/clothes_data.csv");
    [races_columns, races_data] = await get_data_csv("../Data/races_data.csv");

    const armor_save_form = document.getElementById("armor_save_form");
    const armor_save_button = document.getElementById("save_button");
    const raceDropdown = document.getElementById("wearerRace");
    const wearerSize = document.getElementById("BODY_SIZE");
    const tables_section = document.getElementById("tables_section"); 

    const helm_table = new ArmorTable({id:"helm_table", armor_type:"HELM", columns:armor_table_columns, bodyPartRelativeSize:RELATIVE_SIZES.HELM});
    helm_table.make_table(tables_section, "Helm section (headgear)", armor_data);

    const armor_table = new ArmorTable({id:"armor_table", armor_type:"ARMOR", columns:armor_table_columns, bodyPartRelativeSize:RELATIVE_SIZES.UPPER_BODY});
    armor_table.make_table(tables_section, "Armor section (upper body)", armor_data);

    const gloves_table = new ArmorTable({id:"gloves_table", armor_type:"GLOVES", columns:armor_table_columns, bodyPartRelativeSize:RELATIVE_SIZES.HANDS});
    gloves_table.make_table(tables_section, "Gloves section (hands)", armor_data);

    const pants_table = new ArmorTable({id:"pants_table", armor_type:"PANTS", columns:armor_table_columns, bodyPartRelativeSize:RELATIVE_SIZES.LOWER_BODY});
    pants_table.make_table(tables_section, "Pants section (lower body)", armor_data);

    const shoes_table = new ArmorTable({id:"shoes_table", armor_type:"SHOES", columns:armor_table_columns, bodyPartRelativeSize:RELATIVE_SIZES.FEET});
    shoes_table.make_table(tables_section, "Shoes section (footwear)", armor_data);

    armor_save_button.addEventListener("click", function(){
        save_armor_piece(armor_save_form);
        helm_table.load_armor_dropdown(armor_data);
        armor_table.load_armor_dropdown(armor_data);
        gloves_table.load_armor_dropdown(armor_data);
        pants_table.load_armor_dropdown(armor_data);
        shoes_table.load_armor_dropdown(armor_data);
    });

    wearerSize.addEventListener("change", function(){
        helm_table.bodySize = wearerSize.value;
        armor_table.bodySize = wearerSize.value;
        gloves_table.bodySize = wearerSize.value;
        pants_table.bodySize = wearerSize.value;
        shoes_table.bodySize = wearerSize.value;
    });

    load_dropdown({ data: races_data, dropdown: raceDropdown, starting_selected_id: "HUMAN" });
    raceDropdown.addEventListener("change", function () {
        updateInputField(races_columns, races_data, raceDropdown.value, wearerSize);
        wearerSize.dispatchEvent(new Event("change"));
    });

    raceDropdown.dispatchEvent(new Event("change"));
}
function save_armor_piece(armor_save_form) {
    const form_data = new FormData(armor_save_form);
    const new_row = [];
    const id = default_id_treatment(form_data.get("armor_name"));
    form_data.append("armor_id", id);

    const id_in_data = search_element_by_id(armor_data, id);
    
    if (id_in_data === -1) {
        for (const column of armor_columns) {
            const aux = form_data.get(column);
            new_row.push(aux);
            if (column === "shaped") {
                new_row[new_row.length - 1] = form_data.has("shaped");
            }
        }
        armor_data.push(new_row)        
    }
}
function sort_armor(piece_A, piece_B){
    let order = sorted_layers.indexOf(piece_A.layer) - sorted_layers.indexOf(piece_B.layer);
    if (order === 0){
        order = (piece_A.layer_permit - piece_B.layer_permit);
    }
    if (order === 0){ // Same layer? then sort by permit size -> Bigger first
        order = (piece_B.layer_size - piece_A.layer_size);
    }
    return order;
}
class ArmorTable extends Table {
    constructor({ id = null, armor_type, columns, bodyPartRelativeSize: bodyPartRelativeSize, bodySize=1} = {}) {
        super({ id: id, headers: columns })
        this.armor_type = armor_type;
        this.columns = columns;
        this.armor_pieces = [];
        this.bodyPartRelativeSize = bodyPartRelativeSize;
        this.bodySize = bodySize;
    }
    add_piece(index) {
        const piece_data = this.data[index];
        const piece = Armor.from_csv(piece_data);
        this.armor_pieces.push(piece);
        this.armor_pieces.sort(sort_armor);
        this.plot_rows(piece);
    }
    make_table(div, title_text, data) {
        this.title = document.createElement("h3");
        this.title.innerHTML = title_text;
        const [armor_label, armor_dropdown] = create_dropdown({ name: this.armor_type + "_piece_to_add" });
        this.label = armor_label;
        this.dropdown = armor_dropdown;

        this.addition_button = document.createElement("button");
        const id = "add_" + this.armor_type + "_piece"
        this.addition_button.id = id;
        this.addition_button.innerHTML = default_text_treatment(id);        

        this.addition_button.addEventListener("click", (function(){
            this.add_piece(armor_dropdown.value);
        }).bind(this));

        div.append(this.title, armor_label, armor_dropdown, this.addition_button)
        div.append(this.table);

        this.load_armor_dropdown(data);
    }
    load_armor_dropdown(data) {
        this.data = data;        
        const aux = this.armor_type
        const fun = function (element) { return armor_is_of_type(element, aux); }
        load_dropdown({ data: this.data, dropdown: this.dropdown, filling_column: 1, load_condition: fun });
    }
    create_row(piece, lastLayerSize, lastVolume, rowIndex, shapedCount){
        const newLayerSize = parseInt(lastLayerSize) + parseInt(piece.layer_size);        
        let isValid = lastLayerSize < parseInt(piece.layer_permit);
        if ((shapedCount > 0) & (piece.is_shaped)){
            isValid = false;
        }
        const validText = isValid ? "Yes" : "No";
        const shapedText = piece.is_shaped ? "Yes" : "No";
        const pieceVolume = piece.getVolume(lastVolume);
        
        const deleteButton = document.createElement("button");
        deleteButton.innerText = "Delete piece";
        deleteButton.name = "deletePiece";
        deleteButton.addEventListener("click", (function(){
            this.armor_pieces.splice(rowIndex, 1);
            this.plot_rows();
        }).bind(this));

        const info = {"newLayerSize":newLayerSize, "isValid":isValid, "pieceVolume":pieceVolume};
        const row = [default_text_treatment(piece.name), piece.layer, piece.coverage, piece.layer_size, piece.layer_permit, lastLayerSize, shapedText, validText, round_without_decimals(pieceVolume), deleteButton];
        return [info, row];
    }
    plot_rows(){
        this.clean_table();
        let lastLayerSize = 0;
        let lastLayerVolume = this.bodySize * this.bodyPartRelativeSize;
        let shapedCount = 0;
        for(const [index, piece] of this.armor_pieces.entries()){
            const [info, row] = this.create_row(piece, lastLayerSize, lastLayerVolume, index, shapedCount);
            this.add_row(row);
            if (info["isValid"]){
                lastLayerSize = info["newLayerSize"];
                lastLayerVolume += info["pieceVolume"];
                shapedCount += (piece.is_shaped ? 1 : 0);
            }
        }
    }
}
initial_load();