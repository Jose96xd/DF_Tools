import { TEMPERATURE_UNITS, TemperatureConverter } from "../DF_Related/DF_Scripts.js";
import { default_text_treatment, round_without_decimals } from "../Web/Web_Scripts.js";

function initial_load(){
    const temp_div = document.getElementById("temp_div");

    for (const [unit, value] of Object.entries(TEMPERATURE_UNITS)) {
        const text = `Temperature in ${default_text_treatment(unit)}`;

        const label = document.createElement("label");
        label.setAttribute("for", unit);
        label.innerHTML = text;
        const input_field = document.createElement("input");
        input_field.type = "number";
        input_field.id = unit;
        input_field.name = unit;
        input_field.setAttribute("unit", unit);

        input_field.addEventListener("change", function(){
            updated_temp_fields(value, parseFloat(input_field.value), temp_div);
        })

        temp_div.append(label, input_field, document.createElement("br"));
    };

    const aux = document.getElementById("URIST");
    aux.value = 10000;
    aux.dispatchEvent(new Event("change"));
}
function updated_temp_fields(unit, temperature, div){
    const conversions = TemperatureConverter(unit, temperature);
    for (const child of div.children){
        if (child.hasAttribute("unit")){
            const value = conversions[TEMPERATURE_UNITS[child.getAttribute("unit")]];
            child.value = round_without_decimals(value);
        }
    }
}
initial_load();