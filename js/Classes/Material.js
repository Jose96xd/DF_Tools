import { BasicElement } from "./BasicElement.js";

export class Material extends BasicElement{
    constructor({id, name=null, solid_density=7850, impact_yield=1505000, impact_fracture=2520000, impact_strain_at_yield=940,
                 shear_yield=430000, shear_fracture=720000, shear_strain_at_yield=215, max_edge=10000}={}){
        super({id, name});
        this.solid_density = solid_density;
        this.impact_yield = impact_yield;
        this.impact_fracture = impact_fracture;
        this.impact_strain_at_yield = impact_strain_at_yield;
        this.shear_yield = shear_yield;
        this.shear_fracture = shear_fracture;
        this.shear_strain_at_yield = shear_strain_at_yield;
        this.max_edge = max_edge;
    }

}