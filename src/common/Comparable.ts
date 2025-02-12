

export abstract class Comparable<T> {

  constructor() {
  }

  protected deepEqual(obj1: any, obj2: any): boolean {
    // Se sono lo stesso riferimento, sono uguali
    if (obj1 === obj2) return true;

    // Se uno dei due è nullo o non sono oggetti, non sono uguali
    if (obj1 == null || obj2 == null || typeof obj1 !== 'object' || typeof obj2 !== 'object') {
        return false;
    }

    // Ottieni tutte le chiavi degli oggetti
    const keys1 = Object.keys(<object>obj1);
    const keys2 = Object.keys(<object>obj2);

    // Se hanno un numero diverso di chiavi, non sono uguali
    if (keys1.length !== keys2.length) return false;

    // Controlla che ogni chiave e valore sia equivalente
    for (const key of keys1) {
        // Se una chiave di obj1 non esiste in obj2, non sono uguali
        if (!keys2.includes(key)) return false;
        if (!this.deepEqual(obj1[key], obj2[key])) return false;

        // Se il valore della proprietà non è uguale, effettua un confronto ricorsivo
    }

    return true;
  }
  
  public abstract clone(): T;

  public equals(obj: T): boolean {
    //return this.toCommandOptions().join('') == settings.toCommandOptions().join('');
    return this.deepEqual(this, obj);
  }

}