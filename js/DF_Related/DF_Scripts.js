import { BasicElement } from "../Classes/BasicElement.js";
import { Table, createDropdown, load_dropdown, defaultTextTreatment } from "../Web/Web_Scripts.js";

export const TEMPERATURE_UNITS = Object.freeze({
    URIST: Symbol(),
    CELSIUS: Symbol(),
    KELVIN: Symbol(),
    FAHRENHEIT: Symbol(),
    RANKINE: Symbol(),
    WORLDGEN: Symbol()
});

export function attack_belongs_to_weapon(weapon_id, attack_id) {
    return (weapon_id === attack_id);
}
export function armor_is_of_type(element, type) {
    return (type === element[element.length - 1]);
}
export function search_element_by_id(data, id) {
    let on_index = -1;
    for (const [index, row] of data.entries()) {
        if (row[0] === id)
            on_index = index;
    }
    return on_index;
}
export function TemperatureConverter(temperature_unit, temperature) {
    const conversions = {};
    conversions[temperature_unit] = temperature;

    if (temperature_unit !== TEMPERATURE_UNITS.URIST) {
        conversions[TEMPERATURE_UNITS.URIST] = TemperatureToUrist(temperature_unit, temperature);
    }
    for (const [unit, value] of Object.entries(TEMPERATURE_UNITS)) {
        if (!(value in conversions)){
            conversions[value] = TemperatureFromUrist(conversions[TEMPERATURE_UNITS.URIST], value);
        }
    }
    return conversions;
}
export function TemperatureToUrist(unit, temperature) {

    switch (unit) {
        case TEMPERATURE_UNITS.CELSIUS:
            return ((temperature * (9 / 5)) + 10000);
        case TEMPERATURE_UNITS.KELVIN:
            return ((temperature * (9 / 5)) + 9508.33);
        case TEMPERATURE_UNITS.FAHRENHEIT:
            return (temperature + 9968);
        case TEMPERATURE_UNITS.RANKINE:
            return (temperature + 9508.33);
        case TEMPERATURE_UNITS.WORLDGEN:
            return ((temperature * 0.75) + 10000);
    }
}
export function TemperatureFromUrist(temperature, target_unit) {
    switch (target_unit) {
        case TEMPERATURE_UNITS.CELSIUS:
            return ((temperature - 10000) / (9 / 5));
        case TEMPERATURE_UNITS.KELVIN:
            return ((temperature - 9508.33)  / (9 / 5));
        case TEMPERATURE_UNITS.FAHRENHEIT:
            return (temperature - 9968);
        case TEMPERATURE_UNITS.RANKINE:
            return (temperature - 9508.33);
        case TEMPERATURE_UNITS.WORLDGEN:
            return ((temperature - 10000) / 0.75);
    }
}