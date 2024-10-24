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
        const adjusted_impact_yield = this.material.get_adjusted_impact_yield();
        const adjusted_contact_area = this.attacks[attack_index].contact_area;
        return (2 * this.size * adjusted_impact_yield) / adjusted_contact_area;
    }
}