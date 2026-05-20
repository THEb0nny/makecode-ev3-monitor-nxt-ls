const lineSensors: sensors.NXTLightSensor[] = [sensors.nxtLight1, sensors.nxtLight2, sensors.nxtLight3, sensors.nxtLight4]; // Массив всех портов датчиков отражения nxt

const fileName = "ref_raw_nxt_light_sensors.txt"; // Имя временного файла записи медианных значений

function Main() {
    let state = State.ShowValues;

    let refRaw: number[] = [0, 0, 0, 0]; // Массив для хранения сырых значений отражения с датчика

    let whiteRefRawValues: number[][] = [[], [], [], []]; // Массив для хранения сырых значений на белом
    let blackRefRawValues: number[][] = [[], [], [], []]; // Массив для хранения сырых значений на чёрном

    let whiteRefRawMedianValues: number[] = [0, 0, 0, 0];
    let blackRefRawMedianValues: number[] = [0, 0, 0, 0];
    
    while (true) {
        for (let i = 0; i < 4; i++) { // Считываем сырые значения отражения с датчика
            refRaw[i] = lineSensors[i].light(NXTLightIntensityMode.ReflectedRaw);
        }

        if (state == State.ShowValues && brick.buttonEnter.isPressed()) {
            state = State.Waiting;
        } else if (state == State.Waiting && !brick.buttonEnter.isPressed()) {
            state = State.Search;
        } else if (state == State.Search && brick.buttonUp.isPressed()) {
            state = State.SaveWhiteRefRaw;
            for (let i = 0; i < 4; i++) whiteRefRawValues[i].push(refRaw[i]);
            // console.log(colorSensorRefRaw.join(', '));
        } else if (state == State.Search && brick.buttonDown.isPressed()) {
            state = State.SaveBlackRefRaw;
            for (let i = 0; i < 4; i++) blackRefRawValues[i].push(refRaw[i]);
            // console.log(colorSensorRefRaw.join(', '));
        } else if ((state == State.SaveWhiteRefRaw || state == State.SaveBlackRefRaw) && !brick.buttonUp.isPressed() && !brick.buttonDown.isPressed()) {
            state = State.Search;
        } else if (state == State.Search && brick.buttonEnter.isPressed()) {
            state = State.CalculateMedian;
            for (let i = 0; i < 4; i++) {
                whiteRefRawMedianValues[i] = calculateMedian(whiteRefRawValues[i]);
                blackRefRawMedianValues[i] = calculateMedian(blackRefRawValues[i]);
            }
            storage.temporary.remove(fileName); // Удалить файл с таким же именем
            storage.temporary.limit(fileName, 0); // Установить лимит размера файла
            storage.temporary.appendLine(fileName, "White medians:");
            storage.temporary.appendLine(fileName, whiteRefRawMedianValues.join(', '));
            storage.temporary.appendLine(fileName, "Black medians:");
            storage.temporary.appendLine(fileName, blackRefRawMedianValues.join(', '));
        } else if (state == State.CalculateMedian) {
            state = State.CalculationCompleted;
        }

        brick.clearScreen(); // Выводим на экран
        for (let i = 0; i < 4; i++) brick.showValue("refRawPort" + (i + 1), refRaw[i], i + 1);
        if (state == State.ShowValues) {
            brick.printString("Press ENTER to search", 11);
            brick.printString("median values", 12);
        } else if (state == State.Search) {
            brick.printString("Press UP to save white", 6);
            brick.printString("Press DOWN to save black", 7);
            brick.printString("Press ENTER to calculate", 9);
            brick.printString("median values", 10);
        } else if (state == State.SaveWhiteRefRaw) {
            brick.printString("Saved to White!", 6);
        } else if (state == State.SaveBlackRefRaw) {
            brick.printString("Saved to Black!", 6);
        } else if (state == State.CalculateMedian) {
            brick.printString("Processing...", 9);
        } else if (state == State.CalculationCompleted) {
            brick.printString("White medians: ", 7);
            brick.printString(whiteRefRawMedianValues.join(', '), 8);
            brick.printString("Black medians: ", 10);
            brick.printString(blackRefRawMedianValues.join(', '), 11);
        }

        loops.pause(10); // Небольшая задержка для стабильности
    }
}

Main();