import { ColorTranslator } from "../DF_Related/ColorTranslator.js";
import { createInputField, Table } from "../Web/Web_Scripts.js";

async function initial_load() {
    const grid = document.getElementsByClassName("grid")[0];
    const [asciiGrid, asciiInputs] = make_input_table("ASCII Symbols", "asciiCell");
    const [colorGrid, colorInputs] = make_input_table("Color", "colorCell");
    const colorTranslator = new ColorTranslator();
    colorTranslator.loadColors();    
    
    const outputTitle = document.createElement("h3");
    outputTitle.innerHTML = "Output";
    const outputDiv = document.createElement("div");
    const outputTable = new Table();
    outputTable.table.setAttribute("class", "outputTable");
    const outputCells = [];

    outputDiv.appendChild(outputTitle);
    outputDiv.appendChild(outputTable.table);

    for(let i = 0; i < 3; i++){
        const row = []
        for(let j = 0; j < 3; j++){
            const cell = document.createElement("p");
            row.push(cell);
            outputCells.push(cell);
        }
        outputTable.addRow({data:row});
    }
    
    grid.appendChild(asciiGrid);
    grid.appendChild(colorGrid);
    grid.appendChild(outputDiv);

    for(let i = 0; i < 9; i++){
        const aux = function(){
            const symbol = tranlsateASCII(asciiInputs[i].value);
            const colorText = colorInputs[i].value;
            const [color, backgroundColor] = colorTranslator.translateColors(colorText); 
            updateOutputCell(symbol, color["hex"], backgroundColor["hex"], outputCells[i]);
        }
        colorInputs[i].value = "7:0:1";
        asciiInputs[i].addEventListener("change", aux);
        colorInputs[i].addEventListener("change", aux);
    }

}

function tranlsateASCII(text){
    if(isNaN(text)){
        return text.replaceAll("\'", "");
    } else{
        return String.fromCharCode(parseInt(text));
    }
}
function updateOutputCell(symbol, textColor, backgroundColor, cell){
    cell.innerHTML = symbol;
    cell.style.color = textColor;
    cell.style.background = backgroundColor;
}
function make_input_table(title, name, rowNum = 3, columNum = 3) {
    const grid = document.createElement("div");
    const titleElement = document.createElement("h3");
    titleElement.innerHTML = title;
    grid.appendChild(titleElement);
    const inputs = [];
    for (let i = 0; i < rowNum; i++) {
        const row = document.createElement("div");
        for (let j = 0; j < columNum; j++) {
            const inputNum = (i * rowNum) + j;
            const input = createInputField({ name: name, id: inputNum, type: "text" });
            input.setAttribute("class", "gridCell");
            row.appendChild(input)
            inputs.push(input);
        }
        grid.append(row);
    }
    return [grid, inputs];
}

initial_load();