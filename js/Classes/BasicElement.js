import { defaultTextTreatment } from "../Web/Web_Scripts.js";

export class BasicElement{
    constructor({id, name=null}={}){
        this.id = id;
        this.name = (name === null) ? defaultTextTreatment(id) : name;
    }
    static parameters_from_csv(line, columns) {
        const parameters = {};
        for(const [i, column] of columns.entries()){
            parameters[column] = line[i];
        }
        return parameters;
    }
}