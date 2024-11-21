import { get_data_json } from "../Web/Web_Scripts.js";

export class ColorTranslator{
    constructor(){
    }
    async loadColors(){
        this.colors = await (get_data_json("../Data/colorData.json"));
        this.colorsNames = [];
        for(const color of Object.keys(this.colors)){
            this.colorsNames.push(color);
        }
    }
    translateColors(colorText){
        const attributes = colorText.split(":");
        let colorIndex = parseInt(attributes[0]);
        const backgroundColorIndex = parseInt(attributes[1]);
        const brightness = parseInt(attributes[2]);
        if (brightness === 1){
            colorIndex += 8;
        }
        const color = this.colors[this.colorsNames[colorIndex]];
        const backgroundColor = this.colors[this.colorsNames[backgroundColorIndex]];
        return [color, backgroundColor];
    }
    getColor(index){
        return this.colors[this.colorsNames[index]];
    }
}