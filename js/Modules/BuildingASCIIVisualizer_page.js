import { ColorTranslator } from "../DF_Related/ColorTranslator.js";
import { createInputField, Table } from "../Web/Web_Scripts.js";
import { CP437CodeToUTF8Code } from "../DF_Related/ASCIITranslator.js";

async function initial_load() {
    const grid = document.getElementsByClassName("grid")[0];
    const [asciiGrid, asciiInputs] = make_input_table("ASCII Symbols", "asciiCell");
    const [colorGrid, colorInputs] = make_input_table("Color", "colorCell");
    const colorTranslator = new ColorTranslator();
    await (colorTranslator.loadColors());    
    
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
        const updateOutputEvent = function(){
            const symbol = asciiInputs[i].value;
            const colorText = colorInputs[i].value;
            const [color, backgroundColor] = colorTranslator.translateColors(colorText); 
            updateOutputCell(symbol, color["hex"], backgroundColor["hex"], outputCells[i]);
        }

        colorInputs[i].value = "7:0:1";
        asciiInputs[i].addEventListener("change", updateOutputEvent);
        colorInputs[i].addEventListener("change", updateOutputEvent);
        asciiInputs[i].dispatchEvent(new Event("change"));
    }
    
    const rawDiv = document.getElementById("rawDiv");
    const stageInput = document.getElementById("stageNum");
    const rawButton = document.getElementById("rawButton");    

    const rawGenerationEvent = function(){
        const [tileLines, colorLines] = generateRawStrings(asciiInputs, colorInputs, stageInput.value);
        updateRawStrings(rawDiv, tileLines, colorLines);
    }

    rawButton.addEventListener("click", rawGenerationEvent);

}
function translateASCII(text){
    if(isNaN(text)){
        return text.replaceAll("\'", "");
    } else{ 
        const code = parseInt(text)
        const UTF8Code = CP437CodeToUTF8Code(code);        
        return String.fromCharCode(UTF8Code);
    }
}
function updateOutputCell(symbol, textColor, backgroundColor, cell){
    if (symbol.length === 0){
        symbol = " ";
    } else {
        symbol = translateASCII(symbol);
    }
    cell.innerHTML = symbol;
    cell.style.color = textColor;
    cell.style.background = backgroundColor;
}
function updateRawStrings(div, tileLines, colorLines){
    div.innerHTML = "";
    const lines = tileLines.concat(colorLines);
    const p = document.createElement("p");

    for (const line of lines){
        p.innerHTML += line;
        p.innerHTML += "<br>";
    }
    div.appendChild(p);
}
function generateRawStrings(asciiInputs, colorInputs, stage){
    const tileLines = [];
    const colorLines = [];

    for (let i = 0; i < 3; i++){
        let tileLine = `[TILE:${stage}:${i}:`;
        let colorLine = `[COLOR:${stage}:${i}:`;

        for (let j = 0; j < 3; j++){
            const index = (i * 3) + j;
            let symbol = asciiInputs[index].value;

            if ((symbol.length === 0) || (symbol.value === " ")){
                symbol = "\' \'";
            }

            tileLine += `${symbol}`; 
            colorLine += `${colorInputs[index].value}`;
            
            if ((i !== 2) && (j !== 2)){
                tileLine += ":"; 
                colorLine += ":"; 
            } 
        }
        tileLine += "]";
        colorLine += "]";
        tileLines.push(tileLine);
        colorLines.push(colorLine);
    }
    return [tileLines, colorLines];
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