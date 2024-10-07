import { BasicElement } from "./BasicElement.js";

export class Creature extends BasicElement{
    constructor({id, name=null, skill_level=1, race_body_size, creature_body_size, strength, weapon=null}={}){
        super({id, name});
        this.skill_level = skill_level;
        this.race_body_size = race_body_size;
        this.creature_body_size = creature_body_size;
        this.strength = strength;
        this.weapon = weapon;
    }
    set_weapon(weapon){
        this.weapon = weapon;
    }
    get_skill_impact(){
        const limited_skill = Math.min(Math.max(this.skill_level, 0), 14);
        return 1 + ((limited_skill-1) * 1/13);
    }
    get_momentum(attack_index=0){
        const skill_impact = this.get_skill_impact();
        const adjusted_speed = this.weapon.attacks[attack_index].get_adjusted_velocity();
        const momentum = skill_impact * this.race_body_size * this.strength * adjusted_speed / (10**6 * (1 + this.creature_body_size / (this.weapon.material.solid_density * this.weapon.size)));
        return momentum;
    }
}