export enum ServiceStatus {
    Running = "running",
    Exited = "exited",
    Failed = "failed",
}

export class Service {
    private name: string;
    private active: ServiceStatus;
    private description: string;

    public get Name(): string {
        return this.name;
    }

    public get Active(): ServiceStatus {
        return this.active;
    }

    public get Description(): string {
        return this.description;
    }

    constructor(name: string, active: ServiceStatus, description: string) {
        this.name = name;
        this.active = active;
        this.description = description;
    }
}
