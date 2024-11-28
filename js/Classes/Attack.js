import { BasicElement } from "./BasicElement.js";

export class Attack extends BasicElement{
    constructor({id, name=null, contactArea, velocityModifier, penetration, type}={}){
        super({id, name});
        this.contactArea = contactArea;
        this.velocityModifier = velocityModifier;
        this.penetration = penetration;
        this.type = type;
        this.isBlunt = (this.type === "BLUNT");
    }
    getAdjustedVelocity(){
        return this.velocityModifier / 10**3;
    }
    getAdjustedContactArea(){
        return this.contactArea / 10**3;
    }
}