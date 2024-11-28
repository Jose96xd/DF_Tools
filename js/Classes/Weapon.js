import { BasicElement } from "./BasicElement.js";
import { Material } from "./Material.js";

export class Weapon extends BasicElement{
    constructor({id, name=null, quality=1, size, material=new Material(), attacks}={}){
        super({id, name});
        this.size = size;
        this.quality = quality;
        this.material = material;
        this.attacks = attacks;
    }
    getBounceValue(attack_index=0){
        const adjustedImpactYield = this.material.getAdjustedImpactYield();
        const adjustedContactArea = this.attacks[attack_index].contactArea;
        return (2 * this.size * adjustedImpactYield) / adjustedContactArea;
    }
}