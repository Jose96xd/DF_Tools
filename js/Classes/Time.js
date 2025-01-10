export class Time{
    static secondsInDay = 84600;
    static secondsInHour = 3600;
    static secondsInMinute = 60;

    constructor({days=0, hours=0, minutes=0, seconds=0}={}){
        this.days = days;
        this.hours = hours;
        this.minutes = minutes;
        this.seconds = seconds;
    }
    static getDaysFromSeconds(seconds){
        return [Math.floor(seconds / this.secondsInDay), seconds % this.secondsInDay];
    }
    static getSecondsFromDays(days){
        return days * this.secondsInDay;
    }
    static getHoursFromSeconds(seconds){
        return [Math.floor(seconds / this.secondsInHour), seconds % this.secondsInHour];
    }
    static getSecondsFromHours(hours){
        return hours * this.secondsInHour;
    }
    static getMinutesFromSeconds(seconds){
        return [Math.floor(seconds / this.secondsInMinute), seconds % this.secondsInMinute];
    }
    static getSecondsFromMinutes(minutes){
        return minutes * this.secondsInMinute;
    }
    getTotalSeconds(){
        let totalSeconds = this.constructor.getSecondsFromDays(this.days); 
        totalSeconds += this.constructor.getSecondsFromHours(this.hours);
        totalSeconds += this.constructor.getSecondsFromMinutes(this.minutes);
        totalSeconds += this.seconds;
        return totalSeconds;
    }
    toFortTicks(){
        return this.getTotalSeconds() / 72;
    }
    toAdventureTicks(){
        return this.getTotalSeconds() / 0.5;
    }
    toPlantGrowthUnits(){
        return this.toFortTicks() / 100; 
    }
    secondsToTime(seconds){
        [this.days, seconds] = this.constructor.getDaysFromSeconds(seconds);
        [this.hours, seconds] = this.constructor.getHoursFromSeconds(seconds);
        [this.minutes, seconds] = this.constructor.getMinutesFromSeconds(seconds);
        this.seconds = seconds;
    }
    timeFromFortTicks(ticks){
        let totalSeconds = ticks * 72;
        this.secondsToTime(totalSeconds);
    }
    timeFromAdventureTicks(ticks){
        let totalSeconds = ticks * 0.5;
        this.secondsToTime(totalSeconds);
    }
    timeFromPlantGrowthUnits(plantGrowthUnits){
        this.timeFromFortTicks(plantGrowthUnits * 100);
    }
}