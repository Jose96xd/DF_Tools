import { default_text_treatment } from "../web_scripts.js";

export class BasicElement{
    constructor({id, name=null}={}){
        this.id = id;
        this.name = (name === null) ? default_text_treatment(id) : name;
    }
}