export function calculate_momentum(attacker_skill_lvl, BODY_SIZE, attacker_BODY_SIZE, STRENGTH, attack_velocity_modifier, w_SIZE, wm_SOLID_DENSITY){
    attacker_skill_lvl = Math.max(attacker_skill_lvl-1, 0);
    const skill_impact = 1 + (Math.min(attacker_skill_lvl, 14) * 1/14);
    attack_velocity_modifier /= 10**3;
    const momentum = skill_impact * BODY_SIZE * STRENGTH * attack_velocity_modifier / (10**6 * (1 + attacker_BODY_SIZE / (wm_SOLID_DENSITY * w_SIZE)));
    return momentum;
}
export function cut_layer_condition(momentum, weapon_quality, attack_contact_area, wm_SHEAR_YIELD, wm_SHEAR_FRACTURE, wm_MAX_EDGE, armor_quality, am_SHEAR_YIELD, am_SHEAR_FRACTURE){
    const condition_value = (am_SHEAR_YIELD/wm_SHEAR_YIELD + (attack_contact_area+1) * am_SHEAR_FRACTURE/wm_SHEAR_FRACTURE) * (10 + 2*armor_quality) / (wm_MAX_EDGE * weapon_quality);
    return [momentum >= condition_value, condition_value];
}
export function bounce_condition(w_SIZE, attack_contact_area, wm_IMPACT_YIELD, am_SOLID_DENSITY){
    return (2 * w_SIZE * wm_IMPACT_YIELD > attack_contact_area * am_SOLID_DENSITY);
}
export function smash_layer_condition(momentum, attack_contact_area, armor_quality, am_IMPACT_YIELD, am_IMPACT_FRACTURE){
    const condition_value = (2 * am_IMPACT_FRACTURE - am_IMPACT_YIELD) * (2 + 0.4*armor_quality) * attack_contact_area;
    return [momentum >= condition_value, condition_value];
}
export function momentum_reduction(momentum, blunt_attack, successful_penetration, rigid_armor, am_IMPACT_STRAIN_AT_YIELD, am_SHEAR_STRAIN_AT_YIELD){
    let final_momentum = 0;
    const STRAIN_to_use = (blunt_attack ? am_IMPACT_STRAIN_AT_YIELD : am_SHEAR_STRAIN_AT_YIELD)
    
    if (rigid_armor)
        final_momentum = momentum * (STRAIN_to_use / 50000);
    else
        final_momentum = momentum;

    if (successful_penetration)
        final_momentum = momentum - (momentum * 0.05);

    return final_momentum;
}
export function attack_process_calculation(
        momentum=null, attacker_skill_lvl, BODY_SIZE, attacker_BODY_SIZE, STRENGTH, 
        weapon_quality, w_SIZE, attack_contact_area, attack_velocity_modifier, blunt_attack,
        wm_SOLID_DENSITY, wm_SHEAR_YIELD, wm_SHEAR_FRACTURE, wm_IMPACT_YIELD, wm_MAX_EDGE,
        armor_quality, rigid_armor, am_SOLID_DENSITY,
        am_IMPACT_YIELD, am_IMPACT_FRACTURE, am_IMPACT_STRAIN_AT_YIELD,
        am_SHEAR_YIELD, am_SHEAR_FRACTURE, am_SHEAR_STRAIN_AT_YIELD
    ){
    
    if (momentum === null){
        momentum = calculate_momentum(attacker_skill_lvl, BODY_SIZE, attacker_BODY_SIZE, STRENGTH, attack_velocity_modifier, w_SIZE, wm_SOLID_DENSITY);
    }
    const attack_history = {};
    attack_history["initial_momentum"] = momentum;

    if (!blunt_attack){
        const [pass_cut_condition, cut_condition_value] = cut_layer_condition(momentum, weapon_quality, attack_contact_area, wm_SHEAR_YIELD, wm_SHEAR_FRACTURE, wm_MAX_EDGE, armor_quality, am_SHEAR_YIELD, am_SHEAR_FRACTURE);
        attack_history["cut_condition"] = [pass_cut_condition, cut_condition_value];
    }
    if (blunt_attack || !attack_history["cut_condition"][0]){
        const pass_bounce_condition = bounce_condition(w_SIZE, attack_contact_area, wm_IMPACT_YIELD, am_SOLID_DENSITY);
        attack_history["bounce_condition"] = pass_bounce_condition;
        if (pass_bounce_condition){
            const [pass_smash_layer, smash_condition_value] = smash_layer_condition(momentum, attack_contact_area, armor_quality, am_IMPACT_YIELD, am_IMPACT_FRACTURE);
            attack_history["smash_condition"] = [pass_smash_layer, smash_condition_value];
            attack_history["blunt_forever"] = !pass_smash_layer;
        }
    }
    const successful_penetration = !("smash_condition" in attack_history) || (attack_history["smash_condition"][0]);
    attack_history["final_momentum"] = momentum_reduction(momentum, blunt_attack, successful_penetration, rigid_armor, am_IMPACT_STRAIN_AT_YIELD, am_SHEAR_STRAIN_AT_YIELD);
    return attack_history;
}