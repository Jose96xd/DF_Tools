import { BasicElement } from "./BasicElement.js";

export class Attack extends BasicElement{
    constructor({id, name=null, contact_area, velocity_modifier, is_blunt}={}){
        super({id, name});
        this.contact_area = contact_area;
        this.velocity_modifier = velocity_modifier;
        this.is_blunt = is_blunt;
    }
    get_adjusted_velocity(){
        return this.velocity_modifier / 10**3;
    }
}