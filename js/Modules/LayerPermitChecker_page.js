import { get_data_csv, load_dropdown, defaultIdTreatment, createDropdown, defaultTextTreatment, updateInputField, Table, roundWithoutDecimals, loadDropdown} from "../Web/Web_Scripts.js";
import { search_element_by_id, armor_is_of_type } from "../DF_Related/DF_Scripts.js";
import { Armor } from "../Classes/Armor.js";
import { ArmorRepository, RacesRepository } from "../Web/DataRepositore.js";

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

    const armor = new ArmorRepository();
    const armorPromise = armor.load();
    const races = new RacesRepository();
    const racesPromise = races.load();

    const armorSaveForm = document.getElementById("armor_save_form");
    const armorSaveButton = document.getElementById("save_button");
    const raceDropdown = document.getElementById("wearerRace");
    const wearerSize = document.getElementById("BODY_SIZE");
    const tablesSection = document.getElementById("tables_section"); 

    await armorPromise;
    const helmTable = new ArmorTable({id:"helm_table", armor_type:"HELM", columns:armor_table_columns, bodyPartRelativeSize:RELATIVE_SIZES.HELM,
        armorRepository:armor.getSubRepository(filterArmorFunction("HELM"))
    });
    helmTable.make_table(tablesSection, "Helm section (headgear)");

    const armorTable = new ArmorTable({id:"armor_table", armor_type:"ARMOR", columns:armor_table_columns, bodyPartRelativeSize:RELATIVE_SIZES.UPPER_BODY,
        armorRepository:armor.getSubRepository(filterArmorFunction("ARMOR"))
    });
    armorTable.make_table(tablesSection, "Armor section (upper body)");

    const glovesTable = new ArmorTable({id:"gloves_table", armor_type:"GLOVES", columns:armor_table_columns, bodyPartRelativeSize:RELATIVE_SIZES.HANDS,
        armorRepository:armor.getSubRepository(filterArmorFunction("GLOVES"))
    });
    glovesTable.make_table(tablesSection, "Gloves section (hands)");

    const pantsTable = new ArmorTable({id:"pants_table", armor_type:"PANTS", columns:armor_table_columns, bodyPartRelativeSize:RELATIVE_SIZES.LOWER_BODY,
        armorRepository:armor.getSubRepository(filterArmorFunction("PANTS"))
    });
    pantsTable.make_table(tablesSection, "Pants section (lower body)");

    const shoesTable = new ArmorTable({id:"shoes_table", armor_type:"SHOES", columns:armor_table_columns, bodyPartRelativeSize:RELATIVE_SIZES.FEET,
        armorRepository:armor.getSubRepository(filterArmorFunction("SHOES"))
    });
    shoesTable.make_table(tablesSection, "Shoes section (footwear)");

   armorSaveButton.addEventListener("click", function(){
        saveArmorPiece(armorSaveForm);
   });

    wearerSize.addEventListener("change", function(){
        helmTable.bodySize = wearerSize.value;
        armorTable.bodySize = wearerSize.value;
        glovesTable.bodySize = wearerSize.value;
        pantsTable.bodySize = wearerSize.value;
        shoesTable.bodySize = wearerSize.value;
    });

    await racesPromise;
    loadDropdown(races.getAttributes("id"), races.getAttributes("name"), raceDropdown, "HUMAN");
    raceDropdown.addEventListener("change", function () {
        const race = races.getById(raceDropdown.value);
        updateInputField(wearerSize, race.raceBodySize);
        wearerSize.dispatchEvent(new Event("change"));
    });

    raceDropdown.dispatchEvent(new Event("change"));
}
function saveArmorPiece(armorSaveForm, helmTable, armorTable, glovesTable, pantsTable, shoesTable){
    const newPiece = new Armor({
        id:defaultIdTreatment(armorSaveForm["armor_name"]), name:armorSaveForm["armor_name"], armor_type: armorSaveForm["armor_type"],
        layer: armorSaveForm["layer"], coverage: armorSaveForm["coverage"],
        layer_size: armorSaveForm["layer_size"], layer_permit: armorSaveForm["layer_permit"], is_shaped: armorSaveForm["shaped"],
        ubstep: armorSaveForm["ubstep"], lbstep: armorSaveForm["lbstep"], upstep: armorSaveForm["upstep"]
    });
    switch (newPiece.armor_type){
        case helmTable.armor_type:
            helmTable.addPiece(newPiece);
            break;
        case armorTable.armor_type:
            armorTable.addPiece(newPiece);
            break;
        case glovesTable.armor_type:
            glovesTable.addPiece(newPiece);
            break;  
        case pantsTable.armor_type:
            pantsTable.addPiece(newPiece);
            break;    
        case shoesTable.armor_type:
            shoesTable.addPiece(newPiece);
            break;
    }
}
function filterArmorFunction(type){
    return function(piece){ return piece.armor_type === type; };
}
function save_armor_piece(armor_save_form) {
    const form_data = new FormData(armor_save_form);
    const new_row = [];
    const id = defaultIdTreatment(form_data.get("armor_name"));
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
    constructor({ id = null, armor_type, columns, bodyPartRelativeSize: bodyPartRelativeSize, bodySize=1, armorRepository} = {}) {
        super({ id: id, headers: columns })
        this.armor_type = armor_type;
        this.columns = columns;
        this.armorPieces = [];
        this.armorRepository = armorRepository;
        this.bodyPartRelativeSize = bodyPartRelativeSize;
        this.bodySize = bodySize;
    }
    addPiece(id){
        const piece = this.armorRepository.getById(id);
        this.armorPieces.push(piece);
        this.armorPieces.sort(sort_armor);
        this.plotRows();
    }
    make_table(div, title_text) {
        this.title = document.createElement("h3");
        this.title.innerHTML = title_text;
        const [armor_label, armor_dropdown] = createDropdown({ name: this.armor_type + "_piece_to_add" });
        this.label = armor_label;
        this.dropdown = armor_dropdown;

        this.addition_button = document.createElement("button");
        const id = "add_" + this.armor_type + "_piece"
        this.addition_button.id = id;
        this.addition_button.innerHTML = defaultTextTreatment(id);        

        this.addition_button.addEventListener("click", (function(){
            this.addPiece(armor_dropdown.value);
        }).bind(this));

        div.append(this.title, armor_label, armor_dropdown, this.addition_button)
        div.append(this.table);
        
        loadDropdown(this.armorRepository.getAttributes("id"), this.armorRepository.getAttributes("name"), this.dropdown);
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
            this.armorPieces.splice(rowIndex, 1);
            this.plotRows();
        }).bind(this));

        const info = {"newLayerSize":newLayerSize, "isValid":isValid, "pieceVolume":pieceVolume};
        const row = [defaultTextTreatment(piece.name), piece.layer, piece.coverage, piece.layer_size, piece.layer_permit, lastLayerSize, shapedText, validText, roundWithoutDecimals(pieceVolume), deleteButton];
        return [info, row];
    }
    plotRows(){
        this.cleanTable();
        let lastLayerSize = 0;
        let lastLayerVolume = this.bodySize * this.bodyPartRelativeSize;
        let shapedCount = 0;
        for(const [index, piece] of this.armorPieces.entries()){
            const [info, row] = this.create_row(piece, lastLayerSize, lastLayerVolume, index, shapedCount);
            this.addRow({data:row});
            if (info["isValid"]){
                lastLayerSize = info["newLayerSize"];
                //lastLayerVolume += info["pieceVolume"]; // In theory size is not accumulative.
                shapedCount += (piece.is_shaped ? 1 : 0);
            }
        }
    }
}
initial_load();