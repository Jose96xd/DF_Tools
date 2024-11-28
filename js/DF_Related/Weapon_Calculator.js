export function calculate_momentum(attacker, weapon, attack){
    const skill_impact = attacker.getSkillImpact();
    const adjusted_speed = attack.getAdjustedVelocity();
    return skill_impact * attacker.raceBodySize * attacker.strength * adjusted_speed / (10**6 * (1 + attacker.bodySize / (weapon.material.solid_density * weapon.size)));
}
export function cuteLayerCondition(momentum, weapon, armor, attack_index=0){
    const w_material = weapon.material;
    const attack = weapon.attacks[attack_index];
    const a_material = armor.material;

    const first_part = (a_material.shear_yield/w_material.shear_yield + ((attack.getAdjustedContactArea()+1) * a_material.shear_fracture/w_material.shear_fracture))
    const second_part = (10 + (2 * armor.quality));
    const third_part = (w_material.getAdjustedMaxEdge() * weapon.quality);

    const cut_condition_value = (first_part * second_part) / third_part

    return [momentum >= cut_condition_value, cut_condition_value];
}
export function bounceCondition(weapon, a_material, attack_index=0){
    const weapon_bounce_score = weapon.getBounceValue(attack_index);
    return [weapon_bounce_score > a_material.getAdjustedSolidDensity(), weapon_bounce_score];
}
export function smashLayerCondition(momentum, armor, contact_area){
    const a_material = armor.material;
    const adjusted_impact_fracture = a_material.getAdjustedImpactFracture();
    const adjusted_impact_yield = a_material.getAdjustedImpactYield();
    const smash_condition_value = ((2 * adjusted_impact_fracture) - adjusted_impact_yield) * (2 + (0.4*armor.quality)) * contact_area;
    return [momentum >= smash_condition_value, smash_condition_value];
}
export function attackProcessCalculation(momentum=null, attacker, blunt_attack, armor, attack_index=0){
    const weapon = attacker.weapon;
    const attack = weapon.attacks[attack_index];
    const a_material = armor.material;
    const attack_history = {};

    if (momentum === null)
        momentum = attacker.getMomentum();

    attack_history["initial_momentum"] = momentum;
    attack_history["starts_as_blunt_attack"] = blunt_attack;
    attack_history["successful_penetration"] = true;

    if(!blunt_attack){
        const [passed_cut_condition, cut_condition_value] = cuteLayerCondition(momentum, weapon, armor, attack_index);
        attack_history["passed_cut_condition"] = passed_cut_condition
        attack_history["cut_condition_value"] = cut_condition_value;
    }
    if(blunt_attack || !attack_history["passed_cut_condition"]){
        const [passed_bounce_condition, bounce_score] = bounceCondition(weapon, a_material, attack_index);
        attack_history["passed_bounce_condition"] = passed_bounce_condition;
        attack_history["bounce_score"] = bounce_score;
        attack_history["armor_density"] = a_material.solid_density;
        if (passed_bounce_condition){
            const [passed_smash_condition, smash_condition_value] = smashLayerCondition(momentum, armor, attack.contactArea);
            attack_history["passed_smash_condition"] = passed_smash_condition;
            attack_history["smash_condition_value"] = smash_condition_value;
            attack_history["successful_penetration"] = passed_bounce_condition;
            if (!blunt_attack)
                attack_history["blunt_forever"] = !passed_smash_condition;
        }
    }
    attack_history["final_momentum"] = armor.momentumReduction(momentum, blunt_attack, attack_history["successful_penetration"]);
    return attack_history;
}