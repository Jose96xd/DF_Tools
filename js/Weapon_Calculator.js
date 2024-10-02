export function calculate_momentum(attacker_skill_lvl, BODY_SIZE, attacker_BODY_SIZE, STRENGTH, attack_velocity_modifier, w_SIZE, wm_SOLID_DENSITY){
    attacker_skill_lvl = Math.max(attacker_skill_lvl-1, 0);
    const skill_impact = 1 + (Math.min(attacker_skill_lvl, 14) * 1/14);
    attack_velocity_modifier /= 10**3;
    const momentum = skill_impact * BODY_SIZE * STRENGTH * attack_velocity_modifier / (10**6 * (1 + attacker_BODY_SIZE / (wm_SOLID_DENSITY * w_SIZE)));
    return momentum;
}
export function cut_layer_condition(weapon_quality, attack_contact_area, wm_SHEAR_YIELD, wm_SHEAR_FRACTURE, wm_MAX_EDGE, armor_quality, am_SHEAR_YIELD, am_SHEAR_FRACTURE){
    const condition_value = (am_SHEAR_YIELD/wm_SHEAR_YIELD + (attack_contact_area+1) * am_SHEAR_FRACTURE/wm_SHEAR_FRACTURE) * (10 + 2*armor_quality) / (wm_MAX_EDGE * weapon_quality);
    return condition_value;
}
export function bounce_condition(w_SIZE, attack_contact_area, wm_IMPACT_FRACTURE, am_SOLID_DENSITY){
    return (2 * w_SIZE * wm_IMPACT_FRACTURE > attack_contact_area * am_SOLID_DENSITY);
}
export function smash_layer_condition(attack_contact_area, armor_quality, am_IMPACT_FRACTURE, am_IMPACT_YIELD){
    
}