import { BasicElement } from "./BasicElement.js";


export class Weapon extends BasicElement{
    constructor({id, name=null, quality=1, size, material, attacks}={}){
        super({id, name});
        this.size = size;
        this.quality = quality;
        this.material = material;
        this.attacks = attacks;
    }

    get_bounce_value(attack_index=0){
        return (2 * this.size * this.material.impact_yield) / this.attacks[attack_index].contact_area;
    }
}