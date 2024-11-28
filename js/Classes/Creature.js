import { BasicElement } from "./BasicElement.js";
import {calculate_momentum} from "../DF_Related/Weapon_Calculator.js"

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
    setWeapon(weapon){
        this.weapon = weapon;
    }
    getSkillImpact(){
        const limited_skill = Math.min(Math.max(this.skillLevel, 0), 14);
        return 1 + ((limited_skill-1) * 1/13);
    }
    getMomentum(attack_index=0){

        return calculate_momentum(this, this.weapon, this.weapon.attacks[0])
    }
    canEquip(){
        return this.characteristics.includes("EQUIPS");
    }
}