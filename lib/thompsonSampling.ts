// /lib/thompsonSampling.ts

/**
 * A simple implementation of a beta distribution random variable.
 * It uses the relationship between the Gamma and Beta distributions.
 * This is a simplified version and not cryptographically secure.
 */
function beta(alpha: number, beta: number): number {
    // This is a simple approximation. For a more robust solution,
    // a proper statistical library would be used, but this avoids heavy dependencies.
    const gammaA = gamma(alpha);
    const gammaB = gamma(beta);
    if (gammaA === 0 && gammaB === 0) {
        // Handle case where both are zero, perhaps by returning a neutral value
        return 0.5;
    }
    return gammaA / (gammaA + gammaB);
}

/**
 * A simple approximation of the Gamma function for integer values.
 * Note: This is not a full gamma function implementation.
 */
function gamma(n: number): number {
    if (n === 0) return 0;
    if (n === 1) return 1;
    let g = (n - 1) * Math.log(n - 1) - (n - 1);
    for (let i = 0; i < n - 1; i++) {
        g += Math.log(Math.random());
    }
    return Math.exp(g / n);
}


/**
 * ThompsonSampling class to manage the multi-armed bandit problem.
 */
export class ThompsonSampling {
    private arms: Map<string, { alpha: number; beta: number }>;

    constructor(armIds: string[]) {
        this.arms = new Map();
        armIds.forEach(id => {
            // Initialize with alpha=1, beta=1 (uniform prior)
            this.arms.set(id, { alpha: 1, beta: 1 });
        });
    }

    /**
     * Selects an arm to pull based on the Thompson Sampling algorithm.
     * It draws a sample from each arm's beta distribution and selects the arm with the highest sample.
     * @returns {string} The ID of the selected arm.
     */
    selectArm(): string {
        let maxSample = -1;
        let bestArm = '';

        this.arms.forEach((params, armId) => {
            const sample = beta(params.alpha, params.beta);
            if (sample > maxSample) {
                maxSample = sample;
                bestArm = armId;
            }
        });
        return bestArm;
    }

    /**
     * Updates the parameters of an arm based on the observed reward.
     * @param {string} armId - The ID of the arm that was pulled.
     * @param {0 | 1} reward - The reward observed (1 for success, 0 for failure).
     */
    update(armId: string, reward: 0 | 1): void {
        const arm = this.arms.get(armId);
        if (arm) {
            if (reward === 1) {
                arm.alpha += 1; // Increment alpha for a success
            } else {
                arm.beta += 1;  // Increment beta for a failure
            }
        }
    }
}
