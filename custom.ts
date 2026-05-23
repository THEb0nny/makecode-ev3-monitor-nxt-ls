const enum State {
    ShowValues,
    WaitWhite,
    WaitBlack,
    WaitCalibrationStart,
    Calibration,
    Completed,
    FinalResults
}

function median(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    numbers = numbers.sort((a, b) => a - b);
    const half = Math.floor(numbers.length / 2);
    return numbers.length % 2 ? numbers[half] : Math.round((numbers[half - 1] + numbers[half]) / 2);
}