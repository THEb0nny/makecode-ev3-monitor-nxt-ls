const lineSensors: sensors.NXTLightSensor[] = [
    sensors.nxtLight1,
    sensors.nxtLight2,
    sensors.nxtLight3,
    sensors.nxtLight4
]; // Массив всех портов датчиков отражения nxt

const fileName = "nxt_ls_ref_raw.rtf"; // Имя временного файла записи медианных значений

let state = State.ShowValues; // Состояние конечного автомата

const maxSamples = 50; // Максимальное количество семплов при локальной записи

let refRaw: number[] = [0, 0, 0, 0]; // Массив для хранения сырых значений отражения с датчика

// Первичная калибровка
let whiteRefRaw: number[] = [0, 0, 0, 0];
let blackRefRaw: number[] = [0, 0, 0, 0];

let threshold: number[] = [0, 0, 0, 0];

let whiteSamples: number[][] = [[], [], [], []];
let blackSamples: number[][] = [[], [], [], []];

let whiteMedian: number[] = [0, 0, 0, 0];
let blackMedian: number[] = [0, 0, 0, 0];

let allWhiteMedians: number[][] = [[], [], [], []];
let allBlackMedians: number[][] = [[], [], [], []];

let finalWhite: number[] = [0, 0, 0, 0];
let finalBlack: number[] = [0, 0, 0, 0];

let calibrationCount = 0;

let uiUpdateTime = control.millis();

forever(function() {
    for (let i = 0; i < 4; i++) { // Считываем сырые значения отражения с датчика
        refRaw[i] = lineSensors[i].light(NXTLightIntensityMode.ReflectedRaw);
    }

    if (state == State.ShowValues && brick.buttonEnter.wasPressed()) {
        state = State.WaitWhite;
    } else if (state == State.WaitWhite && brick.buttonUp.wasPressed()) {
        for (let i = 0; i < 4; i++) {
            whiteRefRaw[i] = refRaw[i];
        }
        state = State.WaitBlack;
    } else if (state == State.WaitBlack && brick.buttonDown.wasPressed()) {
        for (let i = 0; i < 4; i++) {
            blackRefRaw[i] = refRaw[i];
            threshold[i] = Math.round((whiteRefRaw[i] + blackRefRaw[i]) / 2);
        }
        state = State.WaitCalibrationStart;
    } else if (state == State.WaitCalibrationStart && brick.buttonEnter.wasPressed()) {
        whiteSamples = [[], [], [], []];
        blackSamples = [[], [], [], []];
        state = State.Calibration;
    } else if (state == State.Calibration) {
        if (brick.buttonEnter.wasPressed()) {
            for (let i = 0; i < 4; i++) {
                // Добавляем остатки WHITE
                if (whiteSamples[i].length) {
                    whiteMedian[i] = median(whiteSamples[i]);
                    allWhiteMedians[i].push(whiteMedian[i]);
                    whiteSamples[i] = [];
                }
                // Добавляем остатки BLACK
                if (blackSamples[i].length) {
                    blackMedian[i] = median(blackSamples[i]);
                    allBlackMedians[i].push(blackMedian[i]);
                    blackSamples[i] = [];
                }
            }
            calibrationCount++;
            state = State.Completed;
        } else {
            for (let i = 0; i < 4; i++) {
                // WHITE
                if (refRaw[i] < threshold[i]) {
                    whiteSamples[i].push(refRaw[i]);
                    // Накопили пакет
                    if (whiteSamples[i].length >= maxSamples) {
                        allWhiteMedians[i].push(median(whiteSamples[i]));
                        whiteSamples[i] = [];
                    }
                } else {
                    // BLACK
                    blackSamples[i].push(refRaw[i]);
                    // Накопили пакет
                    if (blackSamples[i].length >= maxSamples) {
                        allBlackMedians[i].push(median(blackSamples[i]));
                        blackSamples[i] = [];
                    }
                }
            }
        }
    }

    if (state == State.Completed && brick.buttonEnter.wasPressed()) {
        for (let i = 0; i < 4; i++) {
            finalWhite[i] = median(allWhiteMedians[i]);
            finalBlack[i] = median(allBlackMedians[i]);
        }
        state = State.FinalResults;
    } else if (state == State.Completed && brick.buttonUp.wasPressed()) {
        state = State.WaitCalibrationStart;
    }

    // UI
    if (control.millis() - uiUpdateTime > 50) {
        uiUpdateTime = control.millis();
        brick.clearScreen();
        for (let i = 0; i < 4; i++) {
            brick.showValue("P" + (i + 1), refRaw[i], i + 1);
        }

        if (state == State.ShowValues) {
            brick.printString("Нажмите ENTER", 6);
            brick.printString("для старта калибровки", 7);
        } else if (state == State.WaitWhite) {
            brick.printString("Поставьте датчики на БЕЛОЕ", 6);
            brick.printString("Нажмите ВВЕРХ", 8);
        } else if (state == State.WaitBlack) {
            brick.printString("Поставьте датчики на ЧЁРНОЕ", 6);
            brick.printString("Нажмите ВНИЗ", 8);
        } else if (state == State.WaitCalibrationStart) {
            brick.printString("Готово к калибровке", 6);
            brick.printString("Нажмите ENTER", 7);
        } else if (state == State.Calibration) {
            brick.printString("КАЛИБРОВКА", 6);
            brick.printString("Водите робота по линии", 8);
            brick.printString("Нажмите ENTER для завершения", 9);
        } else if (state == State.Completed) {
            brick.printString(`Проход ${calibrationCount} ЗАВЕРШЁН`, 6);
            brick.printString("ВВЕРХ для нового прохода", 8);
            brick.printString("ENTER для завершения калиб-ки", 9);
            brick.printString("Б: " + whiteMedian.join(", "), 11);
            brick.printString("Ч: " + blackMedian.join(", "), 12);
        } else if (state == State.FinalResults) {
            brick.printString("Калибровка ЗАВЕРШЕНА", 6);
            brick.printString("Итоговые значения", 8);
            brick.printString("за все проходы", 9);
            brick.printString("Б: " + finalWhite.join(", "), 11);
            brick.printString("Ч: " + finalBlack.join(", "), 12);
        }
    }

    loops.pause(1);
});