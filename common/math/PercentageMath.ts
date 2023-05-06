export class PercentageMath {
    static readonly MAX               = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF")
    static readonly PERCENTAGE_FACTOR = BigInt(10000)
    static readonly HALF_PERCENT      = PercentageMath.PERCENTAGE_FACTOR / BigInt(2);

    static mul(value: bigint, percentage: bigint) {
        if (value == BigInt(0) || percentage == BigInt(0)) {
          return BigInt(0);
        }
        if (value > (PercentageMath.MAX - PercentageMath.HALF_PERCENT) / percentage) {
            throw new Error("MATH_MULTIPLICATION_OVERFLOW")
        }

        return (value * percentage + PercentageMath.HALF_PERCENT) / PercentageMath.PERCENTAGE_FACTOR;
    }

    static div(value: bigint, percentage: bigint) {
        if (percentage == BigInt(0)) {
            throw new Error("MATH_DIVISION_BY_ZERO")
        }
        const halfPercentage = percentage / BigInt(2);
    
        if (value > (PercentageMath.MAX - halfPercentage) / PercentageMath.PERCENTAGE_FACTOR) {
            throw new Error("MATH_MULTIPLICATION_OVERFLOW")
        }
    
        return (value * PercentageMath.PERCENTAGE_FACTOR + halfPercentage) / percentage;
    }
}