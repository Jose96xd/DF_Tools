import { BasicElement } from "./BasicElement.js";

export class Creature extends BasicElement{
    constructor({id, name=null, skillLevel=1, raceBodySize, bodySize=null, strength, characteristics, weapon=null}={}){
        super({id, name});
        this.skillLevel = skillLevel;
        this.raceBodySize = raceBodySize;
        
        if (bodySize === null){
            this.bodySize = raceBodySize;
        } else {
            this.bodySize = bodySize;
        }

        this.strength = strength;
        this.characteristics = characteristics;
        this.weapon = weapon;
    }
    set_weapon(weapon){
        this.weapon = weapon;
    }
    get_skill_impact(){
        const limited_skill = Math.min(Math.max(this.skillLevel, 0), 14);
        return 1 + ((limited_skill-1) * 1/13);
    }
    get_momentum(attack_index=0){
        const skill_impact = this.get_skill_impact();
        const adjusted_speed = this.weapon.attacks[attack_index].get_adjusted_velocity();
        const momentum = skill_impact * this.raceBodySize * this.strength * adjusted_speed / (10**6 * (1 + this.bodySize / (this.weapon.material.solid_density * this.weapon.size)));
        return momentum;
    }
    canEquip(){
        return this.characteristics.includes("EQUIPS");
    }
}