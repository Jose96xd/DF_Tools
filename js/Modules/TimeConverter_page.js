import { TEMPERATURE_UNITS, TemperatureConverter } from "../DF_Related/DF_Scripts.js";
import { roundWithoutDecimals } from "../Web/Web_Scripts.js";
import { Time } from "../Classes/Time.js";

function initialLoad(){
    const timeTable = document.getElementById("timeTable");
    const timeCells = {};
    const fortTicks = document.getElementById("fortTicks");
    const adventureTicks = document.getElementById("adventureTicks");
    const plantGrowthUnits = document.getElementById("plantGrowth");
    const time = new Time();

    for (const input of timeTable.getElementsByTagName("input")){
        timeCells[input.getAttribute("unit")] = input;
        input.addEventListener("change", function(){
            time[input.getAttribute("unit")] = parseFloat(input.value);
            updateTicks(time, fortTicks, adventureTicks, plantGrowthUnits);
        });
    }
    fortTicks.addEventListener("change", function(){
        time.timeFromFortTicks(parseFloat(fortTicks.value));
        updateTime(time, timeCells);
        updateTicks(time, fortTicks, adventureTicks, plantGrowthUnits);
    });
    adventureTicks.addEventListener("change", function(){
        time.timeFromAdventureTicks(parseFloat(adventureTicks.value));
        updateTime(time, timeCells);
        updateTicks(time, fortTicks, adventureTicks, plantGrowthUnits);
    });
    plantGrowthUnits.addEventListener("change", function(){
        time.timeFromPlantGrowthUnits(parseFloat(plantGrowthUnits.value));
        updateTime(time, timeCells);
        updateTicks(time, fortTicks, adventureTicks, plantGrowthUnits)
    });
}
function updateTicks(time, fortTicks, adventureTicks, plantGrowthUnits){
    fortTicks.value = time.toFortTicks();
    adventureTicks.value = time.toAdventureTicks();
    plantGrowthUnits.value = time.toPlantGrowthUnits();
}
function updateTime(time, timeCells){
    timeCells["days"].value = time.days; 
    timeCells["hours"].value = time.hours; 
    timeCells["minutes"].value = time.minutes; 
    timeCells["seconds"].value = time.seconds; 
}
function updatedTempFields(unit, temperature, div){
    const conversions = TemperatureConverter(unit, temperature);
    for (const child of div.children){
        if (child.hasAttribute("unit")){
            const value = conversions[TEMPERATURE_UNITS[child.getAttribute("unit")]];
            child.value = roundWithoutDecimals(value);
        }
    }
}
initialLoad();