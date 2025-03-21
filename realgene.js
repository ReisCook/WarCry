class RealGene {
    constructor(gene) {
        this.value = gene ? gene.value : Math.random();
    }

    clamp() {
        if (this.value > 1) this.value = 1;
        if (this.value < 0) this.value = 0;
    }

    mutate() {
        var range = 0.08;
        this.value += Math.random() * range - range / 2;
        this.clamp();
    }

    crossover(other) {
        if(randomBit()) {
            this.value = other.value;
        }
    }

    blend(other) {
        this.value = (this.value + other.value) / 2;
    }
};

