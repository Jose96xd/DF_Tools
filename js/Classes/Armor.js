import { BasicElement } from "./BasicElement.js";

export class Armor extends BasicElement{
    constructor({id, name=null, quality=1, material, is_rigid=true}={}){
        super({id, name});
        this.quality = quality;
        this.material = material;
        this.is_rigid = is_rigid;
    }
    momentum_reduction(momentum, blunt_attack, successful_penetration){
        let final_momentum = momentum - (momentum * 0.05);
        if (!successful_penetration){
            final_momentum = momentum;
            if(this.is_rigid){
                const strain_to_use = blunt_attack ? this.material.impact_strain_at_yield : this.material.shear_strain_at_yield;
                final_momentum = momentum * (strain_to_use / 50000);
            }
        }
        return final_momentum;
    }
}