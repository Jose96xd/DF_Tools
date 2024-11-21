import { Armor } from "../Classes/Armor.js";
import { Attack } from "../Classes/Attack.js";
import { Creature } from "../Classes/Creature.js";
import { Material } from "../Classes/Material.js";
import { Weapon } from "../Classes/Weapon.js";
import { loadJson } from "./Web_Scripts.js";

const racesPath = "../Data/racesData.json";
const weaponsPath = "../Data/weaponsData.json";
const materialsPath = "../Data/materialsData.json";
const armorPath = "../Data/clothesData.json";

class RepositoryClass {
    constructor(){
        this.data = []
    }
    async load(){}
    add(element){
        this.data.push(element);
    }
    remove(id){
        const index = this.data.findIndex(object => {
            return object.id === id;
        });
        if (index !== -1){
            this.data.splice(index, 1);
        }
    }
    getById(id){
        return this.data.find(element => element.id === id);
    }
    getAll(){
        return this.data;
    }
    getByCondition(condition){
        return this.data.filter((element) => condition(element));
    }
    getSubRepository(condition){
        const subSetOfData = this.data.filter((element => condition(element)));
        const newRepo = new this.constructor();
        newRepo.data = subSetOfData;
        return newRepo;
    }
    getAttributes(attribute){
        return this.data.map(element => {return element[attribute]});;
    }
}
export class MaterialRepository extends RepositoryClass{
    async load(){
        let data = await loadJson(materialsPath);
             
        for(const materialId of Object.keys(data)){
            const materialData = data[materialId];

            const material = new Material({
                id:materialId, name:materialData["name"], solid_density:materialData["SOLID_DENSITY"],
                impact_yield:materialData["IMPACT_YIELD"], impact_fracture:materialData["IMPACT_FRACTURE"], impact_strain_at_yield:materialData["IMPACT_STRAIN_AT_YIELD"],
                shear_yield:materialData["SHEAR_YIELD"], shear_fracture:materialData["SHEAR_FRACTURE"], shear_strain_at_yield:materialData["SHEAR_STRAIN_AT_YIELD"],
                max_edge:materialData["MAX_EDGE"]
            });
            this.data.push(material);
        }
    }
}
export class WeaponsRepository extends RepositoryClass{
    async load(){
        let response = await loadJson(weaponsPath)
        for(const weaponId of Object.keys(response)){
            const weaponData = response[weaponId];

            const attacks = []
            for (const attackData of weaponData["attacks"]){
                const attack = new Attack({
                    id:attackData["name"], name:attackData["name"],
                    contactArea:attackData["contact_area"], penetration:attackData["penetration"],
                    velocityModifier:attackData["velocity_modifier"], type:attackData["type"]
                });
                attacks.push(attack);
            }
            const weapon = new Weapon({id:weaponId, name:weaponData["name"], size:weaponData["SIZE"], attacks:attacks});
            this.data.push(weapon);
        }
    }
}
export class RacesRepository extends RepositoryClass{
    async load(){
        let response = await loadJson(racesPath)
        for(const raceId of Object.keys(response)){
            const raceData = response[raceId];
            const creature = new Creature({
                id:raceId, name:raceData["name"],
                strength:raceData["STRENGTH"], raceBodySize:raceData["BODY_SIZE"],
                characteristics:raceData["characteristics"]
            });
            this.data.push(creature);
        }
    }
}

export class ArmorRepository extends RepositoryClass{
    async load(){
        let response = await loadJson(armorPath)
        for(const armorId of Object.keys(response)){
            const armorData = response[armorId];
            const armorPiece = new Armor({
                id:armorId, name:armorData["name"], armor_type:armorData["armor_type"],
                layer:armorData["LAYER"], coverage:armorData["COVERAGE"], layer_size:armorData["LAYER_SIZE"], layer_permit:armorData["LAYER_PERMIT"],
                is_shaped:armorData["SHAPED"], ubstep:armorData["UBSTEP"], lbstep:armorData["LBSTEP"], upstep:armorData["UPSTEP"]
            });
            this.data.push(armorPiece);
        }
    }
}