const enum State {
    ShowValues,
    Waiting,
    Search,
    SaveWhiteRefRaw,
    SaveBlackRefRaw,
    CalculateMedian,
    CalculationCompleted
}

function median(numbers: number[]): number {
    if (numbers.length === 0) return null;
    numbers = numbers.sort((a, b) => a - b);
    const half = Math.floor(numbers.length / 2);
    return numbers.length % 2 ? numbers[half] : Math.round((numbers[half - 1] + numbers[half]) / 2);
}