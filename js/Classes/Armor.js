import { BasicElement } from "./BasicElement.js";
import { Material } from "./Material.js";

export class Armor extends BasicElement{
    constructor({id, name=null, quality=1, material=new Material(), armor_type, layer, coverage, layer_size, layer_permit, is_shaped, ubstep=0, lbstep=0, upstep=0}={}){
        super({id, name});
        this.quality = quality;
        this.material = material;
        this.armor_type = armor_type;
        this.layer = layer;
        this.coverage = coverage;
        this.layer_size = layer_size;
        this.layer_permit = layer_permit;
        this.is_shaped = is_shaped;
        this.ubstep = ubstep;
        this.lbstep = lbstep;
        this.upstep = upstep;
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
    getVolume(underlyingSize){
        const ubstepValue = (this.ubstep === "MAX") ? 3 : parseInt(this.ubstep);
        const lbstepValue = (this.lbstep === "MAX") ? 3 : parseInt(this.lbstep);
        const upstepValue = (this.upstep === "MAX") ? 3 : parseInt(this.upstep);
        const sizeMultiplier = (this.coverage / 100) * (this.layer_size / 100) * (1 + (ubstepValue + lbstepValue + upstepValue) / 4)
        const size = underlyingSize * sizeMultiplier;
        return size;
    }
    static from_csv(line){
        const piece = new Armor({
            id:line[0], name:line[1], layer:line[2], coverage:line[3],
            layer_size:line[4], layer_permit:line[5], is_shaped:(line[6] === "True"),
            ubstep:line[7], lbstep:line[8], upstep:line[9],
            armor_type:line[line.length-1]
        });
        return piece;
    }
}