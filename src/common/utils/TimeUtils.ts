export abstract class TimeUtils {

  public static isInTimeRange(fromHours: string, toHours: string): boolean {
    const now = new Date();
    
    // Estraiamo l'ora e i minuti dalla stringa in formato hh:mm
    const [fromHour, fromMinute] = fromHours.split(":").map(Number);
    const [toHour, toMinute] = toHours.split(":").map(Number);

    // Otteniamo l'ora corrente in ore e minuti
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Creiamo oggetti Date per le ore 'from', 'to', e l'ora attuale
    const currentTime = new Date();
    currentTime.setHours(currentHour, currentMinute, 0, 0);

    const fromTime = new Date();
    fromTime.setHours(fromHour, fromMinute, 0, 0);

    const toTime = new Date();
    toTime.setHours(toHour, toMinute, 0, 0);

    // Gestione del caso in cui la fascia oraria attraversi la mezzanotte
    if (fromTime > toTime) {
        // Se l'ora attuale è dopo 'fromTime' o prima di 'toTime'
        return currentTime >= fromTime || currentTime <= toTime;
    } else {
        // Caso normale: la fascia oraria è nello stesso giorno
        return currentTime >= fromTime && currentTime <= toTime;
    }
  }
}